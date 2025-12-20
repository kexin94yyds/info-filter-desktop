import UIKit
import Capacitor
import AVFoundation
import UserNotifications
import WebKit

// Darwin 通知回调
private let PasteboardDidChange: @convention(c) (CFNotificationCenter?, UnsafeMutableRawPointer?, CFNotificationName?, UnsafeRawPointer?, CFDictionary?) -> Void = { (center, observer, name, object, userInfo) in
    DispatchQueue.main.async {
        (UIApplication.shared.delegate as? AppDelegate)?.handlePasteboardChange()
    }
}

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate {

    var window: UIWindow?
    var audioPlayer: AVAudioPlayer?
    private var isMonitoringStarted = false
    private var lastPasteboardContent: String? = nil
    private var hasPendingClipboard = false
    
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // 请求通知权限
        UNUserNotificationCenter.current().delegate = self
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
            print("通知权限: \(granted)")
        }
        
        // 启动剪贴板监听
        startPasteboardMonitoring()
        
        // 设置音频会话（后台保活）
        setupAudioSession()
        startBackgroundAudio()
        
        // 定时检查应用是否还在运行
        scheduleKeepAliveNotification()
        
        return true
    }
    
    func startPasteboardMonitoring() {
        guard !isMonitoringStarted else { return }
        isMonitoringStarted = true
        
        print("🔷 开始设置剪贴板监听...")
        
        // 注册 Darwin 通知监听剪贴板变化
        let center = CFNotificationCenterGetDarwinNotifyCenter()
        
        // 监听剪贴板变化通知
        let notificationName = "com.apple.pasteboard.changed" as CFString
        CFNotificationCenterAddObserver(center, nil, PasteboardDidChange, notificationName, nil, .deliverImmediately)
        print("🔷 Darwin 通知监听已注册")
        
        // 调用私有 API 开始监听剪贴板变化
        #if !targetEnvironment(simulator)
        let beginListeningSelector = ["Notifications", "Change", "Pasteboard", "To", "Listening", "begin"].reversed().joined()
        let className = ["Connection", "Server", "PB"].reversed().joined()
        
        if let PBServerConnection = NSClassFromString(className) as AnyObject? {
            _ = PBServerConnection.perform(NSSelectorFromString(beginListeningSelector))
            print("🔷 私有 API 剪贴板监听已启动")
        } else {
            print("❌ 私有 API 类不存在")
        }
        #else
        print("⚠️ 模拟器环境，跳过私有 API")
        #endif
        
        // 同时监听系统通知（备用）
        let changedNotification = ["changed", "pasteboard", "apple", "com"].reversed().joined(separator: ".")
        NotificationCenter.default.addObserver(self, selector: #selector(pasteboardDidUpdate), name: Notification.Name(changedNotification), object: nil)
        print("🔷 系统通知监听已注册")
    }
    
    @objc func pasteboardDidUpdate() {
        DispatchQueue.main.async {
            self.handlePasteboardChange()
        }
    }
    
    func handlePasteboardChange() {
        // 确保在主线程执行
        if !Thread.isMainThread {
            DispatchQueue.main.async {
                self.handlePasteboardChange()
            }
            return
        }

        print("检测到剪贴板变化")
        
        // 标记有待处理的剪贴板内容
        hasPendingClipboard = true
        
        // 如果应用在前台，直接处理
        if UIApplication.shared.applicationState == .active {
            if let content = UIPasteboard.general.string, content != lastPasteboardContent {
                lastPasteboardContent = content
                print("🟢 前台直接处理剪贴板: \(content.prefix(50))")
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                    self.sendClipboardToWebView(content)
                }
                return
            }
        }
        
        print("🟡 应用在后台，准备发送本地通知")
        // 发送通知提示用户
        let notificationContent = UNMutableNotificationContent()
        notificationContent.title = "剪贴板已变化"
        notificationContent.body = "点击返回应用自动处理"
        notificationContent.categoryIdentifier = "CLIPBOARD_CHANGED"
        notificationContent.sound = .default
        
        let request = UNNotificationRequest(identifier: "ClipboardChanged", content: notificationContent, trigger: nil)
        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("❌ 发送通知失败: \(error)")
            } else {
                print("✅ 本地通知已发送")
            }
        }
    }
    
    func scheduleKeepAliveNotification() {
        // 每 5 秒重新调度一次，保持应用活跃
        DispatchQueue.global().asyncAfter(deadline: .now() + 5) { [weak self] in
            self?.scheduleKeepAliveNotification()
        }
    }
    
    func setupAudioSession() {
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playback, mode: .default, options: [.mixWithOthers])
            try session.setActive(true)
        } catch {
            print("音频会话设置失败: \(error)")
        }
    }
    
    func startBackgroundAudio() {
        guard let url = Bundle.main.url(forResource: "silence", withExtension: "mp3") else {
            print("静音音频文件不存在")
            return
        }
        do {
            audioPlayer = try AVAudioPlayer(contentsOf: url)
            audioPlayer?.numberOfLoops = -1
            audioPlayer?.volume = 0.01
            audioPlayer?.play()
            print("静音音频已启动")
        } catch {
            print("播放静音音频失败: \(error)")
        }
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits. 
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // 前台时也触发检测
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        print("🟡 applicationDidBecomeActive")
        // 每次激活时都检查剪贴板（不依赖后台监听）
        hasPendingClipboard = false
        
        // iOS 14+: 先用 detectPatterns 检测是否有 URL，避免不必要的隐私弹窗
        if #available(iOS 14.0, *) {
            UIPasteboard.general.detectPatterns(for: [.probableWebURL]) { result in
                switch result {
                case .success(let patterns):
                    if patterns.contains(.probableWebURL) {
                        // 只有检测到 URL 时才读取剪贴板
                        DispatchQueue.main.async {
                            self.checkAndProcessClipboard()
                        }
                    } else {
                        print("🟡 剪贴板不包含 URL，跳过")
                    }
                case .failure(let error):
                    print("❌ detectPatterns 失败: \(error)")
                }
            }
        } else {
            // iOS 13 及以下直接读取
            checkAndProcessClipboard()
        }
    }
    
    private func checkAndProcessClipboard() {
        guard let content = UIPasteboard.general.string else { return }
        
        print("🟡 剪贴板内容: \(content.prefix(30))...")
        print("🟡 上次内容: \(lastPasteboardContent?.prefix(30) ?? "nil")...")
        
        // 检查是否是链接
        let isUrl = content.hasPrefix("http://") || content.hasPrefix("https://")
        
        if isUrl && content != lastPasteboardContent {
            lastPasteboardContent = content
            print("🟡 检测到新链接，开始处理")
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                self.sendClipboardToWebView(content)
            }
        } else if !isUrl {
            print("🟡 不是链接，跳过")
        } else {
            print("🟡 链接相同，跳过")
        }
    }
    
    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        completionHandler([.banner, .sound])
    }
    
    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
        print("🟢 didReceive 被调用")
        print("📋 categoryIdentifier: \(response.notification.request.content.categoryIdentifier)")
        print("📋 actionIdentifier: \(response.actionIdentifier)")
        
        // 用户点击通知时，读取剪贴板并处理
        if response.notification.request.content.categoryIdentifier == "CLIPBOARD_CHANGED" {
            if let content = UIPasteboard.general.string {
                print("用户点击通知，剪贴板内容: \(content)")
                // 传递内容给 WebView
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                    self.sendClipboardToWebView(content)
                }
            }
        }
        completionHandler()
    }
    
    func sendClipboardToWebView(_ content: String) {
        print("🔵 sendClipboardToWebView 被调用，内容: \(content.prefix(50))")
        
        // 获取 Capacitor 的 WebView
        guard let rootVC = window?.rootViewController else {
            print("❌ rootViewController 为空")
            return
        }
        
        print("✅ rootViewController: \(type(of: rootVC))")
        
        // 递归查找 WKWebView
        func findWebView(in view: UIView) -> WKWebView? {
            if let webView = view as? WKWebView {
                return webView
            }
            for subview in view.subviews {
                if let webView = findWebView(in: subview) {
                    return webView
                }
            }
            return nil
        }
        
        if let webView = findWebView(in: rootVC.view) {
            print("✅ 找到 WebView")
            let escapedContent = content.replacingOccurrences(of: "\\", with: "\\\\")
                .replacingOccurrences(of: "'", with: "\\'")
                .replacingOccurrences(of: "\n", with: "\\n")
            let js = "window.handleClipboardFromNative && window.handleClipboardFromNative('\(escapedContent)');"
            webView.evaluateJavaScript(js) { result, error in
                if let error = error {
                    print("❌ JS 执行错误: \(error)")
                } else {
                    print("✅ 已传递剪贴板内容给 WebView")
                }
            }
        } else {
            print("❌ 未找到 WebView")
        }
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}
