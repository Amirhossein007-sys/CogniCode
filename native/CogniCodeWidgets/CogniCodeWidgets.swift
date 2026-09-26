import WidgetKit
import SwiftUI
import ActivityKit

@main
struct CogniCodeWidgetsBundle: WidgetBundle {
    var body: some Widget { CogniCodeLiveActivity() }
}

private struct ActivityLogo: View {
    var size: CGFloat = 24
    var body: some View {
        Image("ActivityLogo")
            .resizable()
            .scaledToFit()
            .frame(width: size, height: size)
            .clipShape(RoundedRectangle(cornerRadius: size * 0.25))
            .accessibilityLabel("کوگنی کد")
    }
}

private struct AnalysisIndicator: View {
    let state: CogniCodeActivityAttributes.ContentState
    var body: some View {
        // ActivityKit controls animation cadence. Do not use timers or pretend
        // to play audio to obtain the system's Now Playing animation.
        Image(systemName: state.isAnalyzing ? "waveform" : (state.failed ? "exclamationmark.circle.fill" : "checkmark.circle.fill"))
            .font(.system(size: 18, weight: .semibold))
            .foregroundStyle(state.isAnalyzing ? Color.cyan : (state.failed ? Color.orange : Color.green))
            .contentTransition(.symbolEffect(.replace))
            .accessibilityLabel(state.isAnalyzing ? "در حال بررسی کد" : (state.failed ? "نیاز به توجه" : "بررسی تمام شد"))
    }
}

struct CogniCodeLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: CogniCodeActivityAttributes.self) { context in
            HStack(spacing: 12) {
                ActivityLogo(size: 40)
                VStack(alignment: .leading, spacing: 4) {
                    Text("کوگنی کد").font(.headline)
                    Text(context.isStale ? "برای مشاهدهٔ نتیجه برنامه را باز کنید" : context.state.status)
                        .font(.subheadline)
                        .lineLimit(2)
                }
                Spacer(minLength: 8)
                AnalysisIndicator(state: context.state)
            }
            .foregroundStyle(.white)
            .padding(16)
            .activityBackgroundTint(Color(red: 15/255, green: 23/255, blue: 42/255))
            .activitySystemActionForegroundColor(.white)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) { ActivityLogo(size: 32) }
                DynamicIslandExpandedRegion(.trailing) { AnalysisIndicator(state: context.state) }
                DynamicIslandExpandedRegion(.bottom) {
                    Text(context.isStale ? "برای مشاهدهٔ نتیجه برنامه را باز کنید" : context.state.status)
                        .font(.subheadline)
                        .foregroundStyle(.white)
                        .lineLimit(2)
                        .padding(.bottom, 6)
                }
            } compactLeading: {
                ActivityLogo()
            } compactTrailing: {
                AnalysisIndicator(state: context.state).frame(width: 24)
            } minimal: {
                ActivityLogo(size: 20)
            }
            .keylineTint(.cyan)
        }
    }
}
