import WidgetKit
import SwiftUI
import ActivityKit

@main
struct CogniCodeWidgetsBundle: WidgetBundle {
    var body: some Widget {
        CogniCodeLiveActivity()
    }
}

struct CogniCodeLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: CogniCodeActivityAttributes.self) { context in
            LockScreenLiveActivityView(context: context)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    HStack(spacing: 6) {
                        Image(systemName: "curlybraces.square.fill")
                            .font(.system(size: 20))
                            .foregroundStyle(Color(red: 122/255, green: 92/255, blue: 255/255))
                        Text("کوگنی کد")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(.white)
                    }
                    .padding(.leading, 8)
                }

                DynamicIslandExpandedRegion(.trailing) {
                    HStack(spacing: 4) {
                        if context.state.isAnalyzing {
                            Circle()
                                .fill(Color.cyan)
                                .frame(width: 8, height: 8)
                            Text("در حال تحلیل")
                                .font(.system(size: 11, weight: .medium))
                                .foregroundColor(.cyan)
                        } else {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.system(size: 12))
                                .foregroundColor(.green)
                            Text("تکمیل")
                                .font(.system(size: 11, weight: .medium))
                                .foregroundColor(.green)
                        }
                    }
                    .padding(.trailing, 8)
                }

                DynamicIslandExpandedRegion(.bottom) {
                    VStack(alignment: .leading, spacing: 5) {
                        Text(context.state.status)
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(.white)
                            .lineLimit(1)
                        if context.state.isAnalyzing {
                            HStack(spacing: 6) {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .cyan))
                                    .scaleEffect(0.7)
                                Text("هوش مصنوعی در حال پردازش و خطایابی...")
                                    .font(.system(size: 11))
                                    .foregroundColor(.gray)
                            }
                        }
                    }
                    .padding(.horizontal, 10)
                    .padding(.bottom, 6)
                }
            } compactLeading: {
                Image(systemName: "brain.head.profile")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(Color(red: 122/255, green: 92/255, blue: 255/255))
            } compactTrailing: {
                if context.state.isAnalyzing {
                    Image(systemName: "waveform")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(Color.cyan)
                } else {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(Color.green)
                }
            } minimal: {
                Image(systemName: "curlybraces")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(Color(red: 122/255, green: 92/255, blue: 255/255))
            }
        }
    }
}

struct LockScreenLiveActivityView: View {
    let context: ActivityViewContext<CogniCodeActivityAttributes>

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: "brain.head.profile")
                .font(.system(size: 24))
                .foregroundStyle(Color(red: 122/255, green: 92/255, blue: 255/255))
                .frame(width: 44, height: 44)
                .background(Color.white.opacity(0.1))
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))

            VStack(alignment: .leading, spacing: 3) {
                HStack {
                    Text("کوگنی کد")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(.white)
                    Spacer()
                    if context.state.isAnalyzing {
                        Text("در حال تحلیل...")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundColor(.cyan)
                    } else {
                        Text("تکمیل شد ✓")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundColor(.green)
                    }
                }

                Text(context.state.status)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.white.opacity(0.9))
                    .lineLimit(1)
            }
        }
        .padding(14)
        .activityBackgroundTint(Color(red: 15/255, green: 23/255, blue: 42/255))
    }
}
