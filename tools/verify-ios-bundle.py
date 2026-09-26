"""Validate launch metadata and bundled web resources before packaging an IPA."""
import plistlib
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def verify(bundle=None):
    source = ROOT / "native/CogniCode/Info.plist"
    with source.open("rb") as stream:
        expected = plistlib.load(stream)
    assert expected.get("UILaunchStoryboardName") == "LaunchScreen"
    assert expected.get("UILaunchScreen", {}).get("UIColorName") == "LaunchBG"
    assert (ROOT / "native/CogniCode/LaunchScreen.storyboard").is_file()
    assert expected.get("NSSupportsLiveActivities") is True
    assert expected.get("CADisableMinimumFrameDurationOnPhone") is True
    if bundle is None:
        print("Source launch configuration verified")
        return
    bundle = Path(bundle)
    with (bundle / "Info.plist").open("rb") as stream:
        actual = plistlib.load(stream)
    for key in ("UILaunchStoryboardName", "UILaunchScreen", "UIRequiresFullScreen",
                "UISupportedInterfaceOrientations", "NSCameraUsageDescription",
                "NSPhotoLibraryUsageDescription"):
        assert actual.get(key) == expected[key], f"Compiled plist lost or changed {key}"
    assert actual.get("UIDeviceFamily") == [1], "Expected an iPhone application"
    assert (bundle / "LaunchScreen.storyboardc").is_dir(), "Missing compiled launch storyboard"
    assert (bundle / "Assets.car").is_file(), "Missing compiled assets"
    widget = bundle / "PlugIns/CogniCodeWidgets.appex"
    assert widget.is_dir(), "Missing embedded Live Activity extension"
    with (widget / "Info.plist").open("rb") as stream:
        widget_info = plistlib.load(stream)
    assert widget_info["NSExtension"]["NSExtensionPointIdentifier"] == "com.apple.widgetkit-extension"
    assert (widget / "Assets.car").is_file(), "Missing Live Activity logo assets"
    for source_file in (ROOT / "native/Web").rglob("*"):
        if source_file.is_file():
            relative = source_file.relative_to(ROOT / "native")
            target = bundle / relative
            assert target.is_file(), f"Missing {relative}"
            assert target.read_bytes() == source_file.read_bytes(), f"Stale {relative}"
    print("Compiled launch configuration and all web resources verified")


if __name__ == "__main__":
    verify(sys.argv[1] if len(sys.argv) > 1 else None)
