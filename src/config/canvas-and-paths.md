# homeCanvas.json

שדות ל־`LogicCanvas` בדף הבית:

| שדה | תיאור |
|-----|--------|
| `heroEyebrow`, `heroTitle`, `heroSubtitle` | כותרות מעל הגריד |
| `dailyQuote` | `{ "text": string, "attribution"?: string }` |
| `featuredVideo` | `{ "youtubeId": string, "title"?: string, "videoSummaryPoints"?: string[] }` — אם `youtubeId` ריק, אריח הווידאו מוסתר |
| `showTrendGraph` | `boolean` |
| `openQuestion` | `{ "text": string, "href"?: string }` |

# clarityPaths.json

```json
{
  "paths": [
    {
      "id": "string-unique",
      "title": "string",
      "emoji": "string",
      "shortDescription": "string",
      "articleSlugs": ["slug1", "slug2", "slug3"]
    }
  ]
}
```

- בדיוק **3** ערכים ב־`articleSlugs`, תואמים ל־slug של מאמר ב־`src/content/articles/` (ללא `.mdx`), לא draft.
- דפי מסלול: `/journey/{id}`.
