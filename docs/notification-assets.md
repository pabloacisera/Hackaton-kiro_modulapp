# Notification Sound Assets

## Requirements

- Duration: ~300-500ms
- Tone: soft "pop" or "chime"
- Default volume: ~40%
- Format: MP3 or OGG (browser-compatible)

## File location

The final sound file will be stored in the admin-dashboard public assets
directory once chosen with design. Referenced by `TASK-notif-9`
(feature-realtime-notifications).

## Usage

The sound is played by `controllers/useNotifications.ts` when a new notification
arrives via WebSocket. A debounce mechanism ensures max 1 sound every 2 seconds
even if bursts arrive.
