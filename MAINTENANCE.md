# 🛠 PRODUCTION MAINTENANCE & OPERATIONS MANUAL

**Project Name**: Portfolio Bot System (`portfolio-bot`)  
**Scope**: Operational Procedures, Backup & Disaster Recovery, Log Rotation, Security Auditing  
**Document Version**: 1.0.0 (Production Certified)

---

## 1. ROUTINE MAINTENANCE CHECKS

Perform these maintenance routines weekly or monthly:

| Task | Frequency | Command / Action | Target Outcome |
| :--- | :--- | :--- | :--- |
| **Process Status Check** | Daily | `pm2 status portfolio-bot` | Status `online`, Restarts `0` |
| **Memory Footprint** | Weekly | `pm2 monit` | Heap Usage $< 150\text{ MB}$ |
| **Database File Integrity** | Weekly | Inspect `src/database/users.json` & `activityLogs.json` | Valid JSON structure |
| **Automated Log Rotation** | Automatic | Handled by `activityService.ts` (`MAX_LOGS = 50000`) | File size $< 20\text{ MB}$ |
| **Security Audit Logs** | Monthly | Check for `UNAUTHORIZED` entries in Admin Timeline | Zero unverified access attempts |

---

## 2. DATABASE BACKUP PROCEDURES

The database stores state in `src/database/users.json` and `src/database/activityLogs.json`.

### Manual Backup:
```bash
# Create timestamped backup directory
mkdir -p /var/backups/portfolio-bot/$(date +%Y%m%d)

# Copy JSON files atomically
cp /var/www/portfolio-bot/src/database/users.json /var/backups/portfolio-bot/$(date +%Y%m%d)/users.json
cp /var/www/portfolio-bot/src/database/activityLogs.json /var/backups/portfolio-bot/$(date +%Y%m%d)/activityLogs.json
```

### Automated Daily Cron Backup:
Add the following line to `crontab -e`:
```cron
0 3 * * * tar -czf /var/backups/portfolio-bot/backup-$(date +\%F).tar.gz -C /var/www/portfolio-bot/src/database .
```

---

## 3. DISASTER RECOVERY & FILE CORRUPTION CORRECTION

If a server crash or power failure occurs during a write operation:

1. **Automatic Self-Healing**:
   - `helpers.ts` performs atomic writes (`.tmp` $\rightarrow$ `.json`). If the main `.json` file is damaged, `readJson` catches `SyntaxError` and returns a clean fallback (`[]`).
2. **Restoring from Last Backup**:
   ```bash
   pm2 stop portfolio-bot
   cp /var/backups/portfolio-bot/latest/users.json /var/www/portfolio-bot/src/database/users.json
   cp /var/backups/portfolio-bot/latest/activityLogs.json /var/www/portfolio-bot/src/database/activityLogs.json
   pm2 restart portfolio-bot
   ```

---

## 4. ADDING OR REMOVING ADMINISTRATORS

To modify administrator privileges:

1. Edit `ADMIN_IDS` in `src/config/admin.ts` or `.env`:
   ```typescript
   export const ADMIN_IDS: number[] = [
     1053901081, // Primary Admin
     123456789,  // Secondary Admin
   ];
   ```
2. Recompile and restart:
   ```bash
   npm run build && pm2 restart portfolio-bot
   ```
