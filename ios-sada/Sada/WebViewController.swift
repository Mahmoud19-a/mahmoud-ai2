import UIKit
import WebKit

/// Hosts the Sada app (bundled `social/` folder) in a WKWebView and provides two
/// native bridges: `store` (key-value files), `share` (export) and `net` (HTTPS POST to the AI API, no CORS).
final class WebViewController: UIViewController, WKUIDelegate, WKNavigationDelegate, UIScrollViewDelegate {
    private var webView: WKWebView!
    private let storeHandler = StoreHandler()
    private let shareHandler = ShareHandler()
    private let netHandler = NetHandler()
    private static let paper = UIColor(red: 0xFA / 255, green: 0xF7 / 255, blue: 0xF2 / 255, alpha: 1)

    override var preferredStatusBarStyle: UIStatusBarStyle { .darkContent }

    override func loadView() {
        let config = WKWebViewConfiguration()
        let controller = WKUserContentController()
        controller.add(shareHandler, name: "share")
        controller.addScriptMessageHandler(storeHandler, contentWorld: .page, name: "store")
        controller.addScriptMessageHandler(netHandler, contentWorld: .page, name: "net")
        config.userContentController = controller
        config.allowsInlineMediaPlayback = true

        let web = WKWebView(frame: .zero, configuration: config)
        web.uiDelegate = self
        web.navigationDelegate = self
        web.isOpaque = false
        web.backgroundColor = Self.paper
        web.scrollView.backgroundColor = Self.paper
        web.scrollView.bounces = false
        web.scrollView.contentInsetAdjustmentBehavior = .never
        web.scrollView.delegate = self
        web.allowsLinkPreview = false
        if #available(iOS 16.4, *) { web.isInspectable = true }
        webView = web
        shareHandler.presenter = self
        view = web
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        guard let dir = Bundle.main.url(forResource: "social", withExtension: nil) else { return }
        webView.loadFileURL(dir.appendingPathComponent("index.html"), allowingReadAccessTo: dir)
    }

    // No page zoom: the editor has its own pinch-to-zoom.
    func viewForZooming(in scrollView: UIScrollView) -> UIView? { nil }

    // Keep everything inside the app; open real links in Safari.
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        if let url = navigationAction.request.url, url.scheme == "http" || url.scheme == "https" {
            UIApplication.shared.open(url)
            decisionHandler(.cancel)
            return
        }
        decisionHandler(.allow)
    }

    // If the web content process dies (memory pressure), reload instead of showing a blank screen.
    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) { webView.reload() }

    // MARK: alert / confirm / prompt

    private var isArabic: Bool { Locale.preferredLanguages.first?.hasPrefix("ar") ?? false }
    private var okTitle: String { isArabic ? "حسناً" : "OK" }
    private var cancelTitle: String { isArabic ? "إلغاء" : "Cancel" }

    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        let a = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        a.addAction(UIAlertAction(title: okTitle, style: .default) { _ in completionHandler() })
        present(a, animated: true)
    }

    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        let a = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        a.addAction(UIAlertAction(title: cancelTitle, style: .cancel) { _ in completionHandler(false) })
        a.addAction(UIAlertAction(title: okTitle, style: .destructive) { _ in completionHandler(true) })
        present(a, animated: true)
    }

    func webView(_ webView: WKWebView, runJavaScriptTextInputPanelWithPrompt prompt: String, defaultText: String?,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (String?) -> Void) {
        let a = UIAlertController(title: nil, message: prompt, preferredStyle: .alert)
        a.addTextField { $0.text = defaultText }
        a.addAction(UIAlertAction(title: cancelTitle, style: .cancel) { _ in completionHandler(nil) })
        a.addAction(UIAlertAction(title: okTitle, style: .default) { _ in completionHandler(a.textFields?.first?.text) })
        present(a, animated: true)
    }
}

/// Saves each key as a JSON file in Application Support/SadaData.
final class StoreHandler: NSObject, WKScriptMessageHandlerWithReply {
    private let dir: URL
    private let queue = DispatchQueue(label: "sada.store")

    override init() {
        let base = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        dir = base.appendingPathComponent("SadaData", isDirectory: true)
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        super.init()
    }

    private func fileURL(_ key: String) -> URL {
        let safe = key.unicodeScalars.map { s -> String in
            let c = Character(s)
            return (s.isASCII && (c.isLetter || c.isNumber)) || c == "-" || c == "_" ? String(c) : "_"
        }.joined()
        return dir.appendingPathComponent(safe + ".json")
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage,
                               replyHandler: @escaping (Any?, String?) -> Void) {
        guard let body = message.body as? [String: Any], let op = body["op"] as? String, let key = body["key"] as? String else {
            replyHandler(nil, "bad message")
            return
        }
        let url = fileURL(key)
        let value = body["value"] as? String
        queue.async {
            var result: Any? = nil
            var error: String? = nil
            switch op {
            case "get":
                if let data = try? Data(contentsOf: url) { result = String(data: data, encoding: .utf8) }
            case "set":
                do { try Data((value ?? "null").utf8).write(to: url, options: .atomic); result = true }
                catch let e { error = e.localizedDescription }
            case "del":
                try? FileManager.default.removeItem(at: url)
                result = true
            default:
                error = "unknown op"
            }
            DispatchQueue.main.async { replyHandler(result, error) }
        }
    }
}

/// Receives exported files as data URLs and opens the iOS share sheet
/// (Save Image, Save to Files, AirDrop, WhatsApp, …).
final class ShareHandler: NSObject, WKScriptMessageHandler {
    weak var presenter: UIViewController?

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let body = message.body as? [String: Any], let files = body["files"] as? [[String: Any]] else { return }
        let fm = FileManager.default
        let folder = fm.temporaryDirectory.appendingPathComponent("export-\(Int(Date().timeIntervalSince1970))", isDirectory: true)
        try? fm.createDirectory(at: folder, withIntermediateDirectories: true)
        var items: [Any] = []
        for file in files {
            guard let name = file["name"] as? String, let dataURL = file["data"] as? String,
                  let comma = dataURL.firstIndex(of: ",") else { continue }
            let b64 = String(dataURL[dataURL.index(after: comma)...])
            guard let bytes = Data(base64Encoded: b64, options: .ignoreUnknownCharacters) else { continue }
            let safeName = name.replacingOccurrences(of: "/", with: "-")
            let url = folder.appendingPathComponent(safeName.isEmpty ? "design" : safeName)
            if (try? bytes.write(to: url, options: .atomic)) != nil { items.append(url) }
        }
        guard !items.isEmpty, let vc = presenter else { return }
        let sheet = UIActivityViewController(activityItems: items, applicationActivities: nil)
        if let pop = sheet.popoverPresentationController {
            pop.sourceView = vc.view
            pop.sourceRect = CGRect(x: vc.view.bounds.maxX - 60, y: vc.view.safeAreaInsets.top + 30, width: 1, height: 1)
            pop.permittedArrowDirections = .up
        }
        vc.present(sheet, animated: true)
    }
}

/// Sends the AI request with URLSession so the web page has no CORS problems.
/// Only https://openrouter.ai is allowed.
final class NetHandler: NSObject, WKScriptMessageHandlerWithReply {
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage,
                               replyHandler: @escaping (Any?, String?) -> Void) {
        guard let body = message.body as? [String: Any], let urlString = body["url"] as? String,
              let url = URL(string: urlString), url.scheme == "https", url.host == "openrouter.ai" else {
            replyHandler(nil, "blocked url")
            return
        }
        var request = URLRequest(url: url, timeoutInterval: 120)
        request.httpMethod = "POST"
        (body["headers"] as? [String: String] ?? [:]).forEach { request.setValue($0.value, forHTTPHeaderField: $0.key) }
        request.httpBody = (body["body"] as? String ?? "").data(using: .utf8)
        URLSession.shared.dataTask(with: request) { data, response, error in
            let status = (response as? HTTPURLResponse)?.statusCode ?? 0
            let text = data.flatMap { String(data: $0, encoding: .utf8) } ?? (error?.localizedDescription ?? "")
            DispatchQueue.main.async { replyHandler(["status": status, "text": text], nil) }
        }.resume()
    }
}
