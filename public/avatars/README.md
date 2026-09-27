# Avatar assets

`lam-reference.zip` is the upstream LAM_WebRender reference avatar (`asset/arkit/p2-1.zip`), used to verify rendering and animation. It is **not Siddharth**. Source: https://github.com/aigc3d/LAM_WebRender . See the accompanying upstream licence.

`siddharth.zip` is the user's custom Siddharth portrait exported through the official LAM ModelScope demo, supplied as `chatting_avatar_20260928033216.zip` on 28 September 2026. It is 4,102,340 bytes; SHA-256: `a3bd7728cd7ffa0700905b48d5eaa6e8d7be5dd51e59cef79264bb9dbf4a08f4`. It is an AI-generated character asset, not an archival photograph. Local configuration uses this model.

For a future model, export **ZIP file for Chatting Avatar**, preserve the existing custom ZIP, then import with:

```powershell
python scripts/import-avatar.py 'C:\path\to\downloaded-avatar.zip'
```

The importer keeps provider credentials unchanged and connects `/avatars/siddharth.zip` locally. Only enable this asset after checking that the exported portrait and mouth movement match the intended character.
