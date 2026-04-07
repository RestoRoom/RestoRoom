# Rec Room API Endpoints (Schools Out Update)
> Compiled from community findings — Discussion #8 by AdvertRR

## Social & Relationships
| Endpoint | Method | Notes |
|----------|--------|-------|
| `/api/relationships/v2/get` | GET | Get relationships |
| `/api/relationships/v1/ignore` | POST | Ignore a player |
| `/api/relationships/v1/unignore` | POST | Unignore a player |
| `/api/relationships/v1/mute` | POST | Mute a player |
| `/api/relationships/v1/unmute` | POST | Unmute a player |
| `/api/messages/v1/friendOnlineStatus` | GET | Check if friends are online |
| `/api/messages/v2/get` | GET | Get messages |
| `/api/externalfriendinvite/v1/getplatformreferrers` | GET | Get platform friend invite referrers |

## Players & Profiles
| Endpoint | Method | Notes |
|----------|--------|-------|
| `/api/players/v1/playerPhotoTaggingSetting` | GET | Photo tagging setting |
| `/api/players/v2/progression/bulk?id=` | GET | Bulk player progression by ID |
| `/api/progressionEvents/active` | GET | Active progression events |
| `/api/progressionEvents/event/id` | GET | Progression event |
| `/api/purchasableXpBoosts/activations` | GET | XP boost activations |
| `/api/playerReputation/v2/bulk?id=` | GET | Bulk player reputation by ID|

## Rooms
| Endpoint | Method | Notes |
|----------|--------|-------|
| `/api/rooms/v1/filters` | GET | Room filter options |
| `/api/rooms/v1/verifyRole` | POST | Verify player role in room |
| `/api/rooms/v3/report` | POST | Report a room |
| `/api/quickPlay/v1/getandclear` | POST | Quick play queue |

## Images & Media
| Endpoint | Method | Notes |
|----------|--------|-------|
| `/api/images/v2/named` | GET | Named images |
| `/api/images/v5/cheered/bulk` | GET | Bulk cheered images |
| `/api/images/v1/cheer` | POST | Cheer an image |
| `/api/PlayerCheer/v1/create` | POST | Create a player cheer |

## Moderation & Reporting
| Endpoint | Method | Notes |
|----------|--------|-------|
| `/api/PlayerReporting/v1/voteToKickReasons` | GET | Vote-to-kick reason list |
| `/api/PlayerReporting/v1/moderationBlockDetails` | GET | Moderation block details |
| `/api/PlayerReporting/v1/roomModKick` | POST | Room mod kick action |

## Avatar & Outfits
| Endpoint | Method | Notes |
|----------|--------|-------|
| `/api/customAvatarItems/v1/bulk` | GET | Bulk custom avatar items |
| `/api/customAvatarItems/v1/isRenderingEnabled` | GET | Check if rendering is enabled |
| `/api/customAvatarItems/v1/isCreationEnabled` | GET | Check if creation is enabled |
| `/api/customAvatarItems/v1/isCreationAllowedForAccount` | GET | Account-level creation permission |
| `/outfits/me/saved` | GET | Saved outfits |

## Inventions
| Endpoint | Method | Notes |
|----------|--------|-------|
| `/api/inventions/v2/mine` | GET | My inventions |
| `/api/inventions/v1/room?id=` | GET | Room inventions by ID |

## Config & Misc
| Endpoint | Method | Notes |
|----------|--------|-------|
| `/api/config/v2` | GET | App config |
| `/api/gameconfigs/v1/all ` | GET | Game configs |
| `/api/versioncheck/islandedversions` | GET | Islanded version check |
| `/api/keepsakes/globalconfig` | GET | Keepsakes global config |
| `/api/keepsakes/categories` | GET | Keepsakes categories |
| `/api/playerevents/v1/all` | GET | All player events |
| `/api/playerevents/v1/tagfilters` | GET | Player event tag filters |
| `/api/communityboard/v2/current` | GET | Current community board |
| `/statsigUserProperties` | GET | Statsig user properties |

## Content Moderation
| Endpoint | Method | Notes |
|----------|--------|-------|
| `/api/sanitize/v1` | POST | Sanitize content |
| `/api/sanitize/v1/isPure` | GET | Check if content is clean |

---

**Base URL:** `https://api.rec.net`

**Source:** Community-gathered via HTTP debugging (AdvertRR, RestoRoom Discussion #8)

> ⚠️ These endpoints require authentication. Methods are inferred — verify with actual traffic capture.
