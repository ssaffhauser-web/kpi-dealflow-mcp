# Publish Steps — do these next session

## 1. Generate Jarvis API key (5 min)

1. Go to **kpidealflow.com/settings → API Access**
2. Type name: `Jarvis` → click **Generate Key**
3. Copy the key (shown once)
4. Open `C:\Users\ssaff\Projects\Jarvis\.env`
5. Find the line: `KPIDEALFLOW_API_KEY=`
6. Paste the key after the `=` and save

Jarvis can now add/update leads in KPI DealFlow via the EA agent.

---

## 2. Push MCP to GitHub (10 min)

1. Go to **github.com/new**
   - Name: `kpi-dealflow-mcp`
   - Visibility: **Public**
   - ✅ No README, no .gitignore (files are already there)
   - Click **Create repository**

2. Copy the repo URL (e.g. `https://github.com/ssaffhauser/kpi-dealflow-mcp.git`)

3. In a terminal at `C:\Users\ssaff\Projects\kpi-dealflow-mcp`:
   ```
   git remote add origin https://github.com/ssaffhauser/kpi-dealflow-mcp.git
   git push -u origin master
   ```

---

## 3. Publish MCP to npm (5 min)

From `C:\Users\ssaff\Projects\kpi-dealflow-mcp`:

```
npm login
```
(Enter npm username + password + email)

```
npm publish
```

After this, anyone can install it with:
```
npx kpi-dealflow-mcp
```

---

## 4. Update the GitHub link in Settings (2 min)

The Settings page already has an "Install the MCP server" link pointing to:
`https://github.com/ssaffhauser/kpi-dealflow-mcp`

Once the repo is public at that URL, the link works automatically. Nothing else to change.

---

## Done checklist

- [ ] Jarvis API key set in .env
- [ ] GitHub repo created and pushed
- [ ] npm publish ran successfully
- [ ] Test: tell Jarvis "add [test name] as a lead, buyer, cold call, no qualifiers" → check KPI DealFlow leads page
