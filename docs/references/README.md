# Android 4.1 visual references

These are the primary visual references used to check the Jelly Bean launcher recreation.

## Galaxy Nexus — Android 4.1 home screen

- Screenshot: `android-4.1-galaxy-nexus-home.jpg`
- Original file: https://commons.wikimedia.org/wiki/File:Android_4.1_on_the_Galaxy_Nexus.jpeg
- Captured: 1 July 2012; device: Samsung Galaxy Nexus; software: Android 4.1 Jelly Bean.
- Author/attribution: Android Open Source Project.
- License: Creative Commons Attribution 2.5 Generic (CC BY 2.5), as documented on the Commons file page.
- The screenshot is used as a visual reference; it is not the portfolio wallpaper.

## Nexus 7 — Android 4.1 tablet UI

- Screenshot reference gallery: https://deviceguru.com/google-nexus-7-screenshots/
- Published: 13 August 2012; more than 350 screenshots of the Android 4.1-based Nexus 7, including initial homescreens, widgets, apps, and system UI.
- The site is copyrighted by DeviceGuru; it is linked as a reference and its screenshots are not redistributed here.

## Source assets

- AOSP Android 4.1.2_r1 source tag: https://android.googlesource.com/platform/frameworks/base/+/android-4.1.2_r1
- AOSP Launcher2 source tag: https://android.googlesource.com/platform/packages/apps/Launcher2/+/android-4.1.2_r1
- AOSP DeskClock source tag: https://android.googlesource.com/platform/packages/apps/DeskClock/+/android-4.1.2_r1
- The project uses the original AOSP 4.1.2 wallpaper variants, app launcher PNGs, analog-clock widget layers, and app-drawer icon. License notices are in `public/jellybean/`.

## Official Nexus 7 Android 4.1 guidebook

- PDF: https://dlcdnet.asus.com/pub/ASUS/EeePAD/Nexus7/Nexus7Guidebook071212ENG.pdf
- The guidebook documents the Android 4.1 notification shade, one-finger pull-down gesture, expandable notifications, the clear-all control, and the bottom navigation bar (printed pages 10–12; PDF page 17 contains the annotated notification-shade screenshot).
- It is a primary product reference; the PDF is linked, not redistributed.

## Large-tablet landscape behavior

- Computerworld, 5 July 2012: https://www.computerworld.com/article/1486645/confirmed-android-4-1-uses-different-layouts-for-different-tablet-sizes.html
- The article reports that Android 4.1 retained a landscape-style UI and bottom-right notification area on 10-inch tablets, while the 7-inch Nexus 7 retained a portrait-style home screen. This portfolio intentionally follows the large-tablet landscape behavior when the browser is in landscape, as requested.

Additional exact AOSP source trees used for the assets:
- DeskClock: https://android.googlesource.com/platform/packages/apps/DeskClock/+/android-4.1.2_r1
- SystemUI: https://android.googlesource.com/platform/frameworks/base/+/android-4.1.2_r1/packages/SystemUI

The Google Search bar asset is cropped from the attributed Galaxy Nexus screenshot above. It is a visual recreation of the original widget, not a functional Google search field.


## Messaging app visual references

- AOSP Android 4.1.2 Mms application source: https://android.googlesource.com/platform/packages/apps/Mms/+/android-4.1.2_r1. The stock app uses a Holo action bar, conversation list, recipient/conversation screen, and a message composer at the bottom.
- AOSP Android 4.1.1 Mms source tag: https://android.googlesource.com/platform/packages/apps/Mms/+/android-4.1.1_r1.
- Visual reference for the conversation bubbles and bottom composer: TechRadar's Motorola Droid RAZR HD Messaging screenshot (Android 4.0-era Holo UI): https://www.techradar.com/reviews/phones/mobile-phones/motorola-droid-razr-hd-1095289/review/5. This is a period-correct visual reference, not the exact Nexus/stock 4.1 app build.
- The portfolio messaging screen adapts the AOSP conversation layout while submitting a contact enquiry through the existing email-verification workflow; it does not pretend to send SMS.

## Microbes live wallpaper

- The iconic Microbes wallpaper originally shipped with the Nexus S / Android 2.3 Gingerbread, not Android 4.1. The requested recreation intentionally combines that wallpaper with the Android 4.1 launcher.
- Droid Life, 16 December 2010: https://www.droid-life.com/2010/12/16/download-nexus-s-microbes-live-wallpaper/ (Nexus S Microbes live wallpaper identification and release context).
- IntoMobile, 15 December 2010: https://www.intomobile.com/2010/12/15/android-2-3-gingerbread-video-walkthrough-nfc-text-selection-tool-live-wallpaper-and-more/ (describes touch-created food particles, attraction, growth and division).
- The browser recreation uses original CSS-rendered spheres and touch-created food particles. It does not redistribute the original proprietary APK or its artwork.

## Android launcher layout reference

- Android 4.0/4.1 screenshot guide: https://controlmysms.com/images/AndroidConfigManual.pdf. The guide shows the phone dock (Phone, People, app drawer, Messaging, Browser), separate Back/Home/Recent navigation bar, and four-column app drawer with APPS/WIDGETS tabs.
- Android Authority, Android 4.1 vs 4.2 comparison: https://www.androidauthority.com/android-4-1-vs-android-4-2-jelly-bean-149740/ (describes the stock conversation-thread and SMS/MMS bubble interface).


## Micromax A110 and Android Water live wallpaper

- Micromax Canvas 2 A110 launched with Android 4.0.4 and received an official Android 4.1.1 Jelly Bean update in March 2013. The launcher identifies the device as `Micromax A110` and uses the Jelly Bean-era Water ripple interaction.
- Android Open Source Project live-wallpaper documentation: https://android.googlesource.com/platform/frameworks/base/+/859f455645bc49e32330108b1ea9f85ffb80a2cd/docs/html/resources/articles/live-wallpapers.jd (documents `android.wallpaper.tap` and the Water wallpaper's touch-generated ripples).
- Micromax A110 Canvas 2 review: https://www.gadgets360.com/mobiles/reviews/micromax-a110-superfone-canvas-2-review-324251/ (launch OS and device interface).
- Micromax A110 Android 4.1.1 update announcement: https://www.gsmarena.com/micromax_launches_jelly_bean_411_for_a110_canvas_2-news-5699.php.
- The browser implementation uses an original lightweight Canvas renderer; it does not bundle a proprietary APK or copy third-party wallpaper assets.

## Micromax A110 Water wallpaper and launcher brand marks

- The Water wallpaper visual is based on the original Xllusion **Water live wallpaper** (package `com.xllusion.livewallpaper.water`, Android 4.0-era release). The repository image is a crop of the wallpaper area from the Phoneky preview at https://prodigits.co.uk/pthumbs/android/thumbs/0/water.jpg; it is not the original APK or a full-resolution export. The web launcher layers its own touch-driven ripple effect over that reference image.
- Water Live Wallpaper app listing and feature description: https://play.google.com/store/apps/details?id=com.xllusion.livewallpaper.water
- Chess.com, Lichess, and GitHub marks are sourced from Simple Icons (`https://cdn.simpleicons.org/`); Simple Icons artwork is CC0. Product names and marks remain the property of their respective owners.
