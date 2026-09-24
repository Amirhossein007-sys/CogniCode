import Foundation
#if canImport(ActivityKit)
import ActivityKit

public struct CogniCodeActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable, Sendable {
        public var status: String
        public var isAnalyzing: Bool

        public init(status: String, isAnalyzing: Bool) {
            self.status = status
            self.isAnalyzing = isAnalyzing
        }
    }

    public var appName: String

    public init(appName: String = "CogniCode") {
        self.appName = appName
    }
}
#endif
