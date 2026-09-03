# DSH 双 Profile 分离实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `web` 使用 DSH Home 内的独立插件包，`web-dev` 保留源码链接验证能力。

**Architecture:** 稳定包构建为版本化 `.tgz`，保存到运行时解析的 DSH Home；`web` 通过 DSH 的 pnpm 接口安装该包。`web-dev` 复制 `web` 的配置层但具有独立依赖目录，并链接当前源码。不得绕过供应链策略。

**Tech Stack:** DeepSeek Harness profile、pnpm、Node.js、npm、PowerShell。

---

### Task 1: 备份并生成稳定安装包

**Files:**
- Create: `$dshRoot/backups/dsh-skill-browser-migration-<timestamp>/`
- Create: `$dshRoot/local-packages/dsh-skill-browser/dsh-skill-browser-<version>.tgz`

- [ ] **Step 1: 解析 DSH Home 与当前 web profile**

```powershell
$dshRoot = if ($env:DSH_HOME) { $env:DSH_HOME } else { Join-Path ([Environment]::GetFolderPath('UserProfile')) '.dsh' }
$webProfile = Join-Path $dshRoot 'profiles/web'
```

- [ ] **Step 2: 备份配置与锁文件**

```powershell
$backupRoot = Join-Path $dshRoot ('backups/dsh-skill-browser-migration-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Path $backupRoot -ErrorAction Stop | Out-Null
foreach ($name in @('package.json','pnpm-lock.yaml','cordis.patch.yml','cordis.yml','pnpm-workspace.yaml')) { $source=Join-Path $webProfile $name; if (Test-Path -LiteralPath $source) { Copy-Item -LiteralPath $source -Destination (Join-Path $backupRoot $name) -ErrorAction Stop } }
Get-FileHash -Algorithm SHA256 (Join-Path $webProfile 'package.json'),(Join-Path $webProfile 'pnpm-lock.yaml')
```

- [ ] **Step 3: 验证、构建、打包**

```powershell
npm run verify
$archiveDir=Join-Path $dshRoot 'local-packages/dsh-skill-browser'; New-Item -ItemType Directory -Path $archiveDir -Force | Out-Null
$pack=npm pack --json --pack-destination $archiveDir | ConvertFrom-Json; $tarball=Join-Path $archiveDir $pack[0].filename
npm pack --dry-run
```

Expected: 75 项测试通过，tarball 位于 DSH Home，清单无个人文件或 profile 文件。

### Task 2: 创建独立 web-dev profile

**Files:**
- Create: `$dshRoot/profiles/web-dev/`（仅 profile 配置与独立依赖）

- [ ] **Step 1: 复制非依赖配置层**

```powershell
$devProfile=Join-Path $dshRoot 'profiles/web-dev'; if(Test-Path -LiteralPath $devProfile){throw 'web-dev already exists'}; New-Item -ItemType Directory -Path $devProfile -ErrorAction Stop | Out-Null
foreach($name in @('package.json','pnpm-lock.yaml','cordis.patch.yml','cordis.yml','pnpm-workspace.yaml')){$source=Join-Path $webProfile $name;if(Test-Path -LiteralPath $source){Copy-Item -LiteralPath $source -Destination (Join-Path $devProfile $name) -ErrorAction Stop}}
```

- [ ] **Step 2: 安装源码链接并确认配置加载**

```powershell
dsh plugin --profile web-dev add "link:$((Get-Location).Path)" --offline --save-exact
dsh --profile web-dev --dump-config | Select-String -Pattern 'dsh-skill-browser|qx-skill-browser'
```

Expected: web-dev 使用 `link:` 并显示插件条目。

### Task 3: 迁移稳定 web profile 并验证

**Files:**
- Modify: `$dshRoot/profiles/web/package.json`
- Modify: `$dshRoot/profiles/web/pnpm-lock.yaml`
- Modify: `README.md`

- [ ] **Step 1: 停止仅用于验证的 3080 实例并直接覆盖同名依赖**

```powershell
$listener=Get-NetTCPConnection -LocalAddress 127.0.0.1 -LocalPort 3080 -State Listen -ErrorAction SilentlyContinue|Select-Object -First 1;if($listener){Stop-Process -Id $listener.OwningProcess -ErrorAction Stop}
dsh plugin --profile web add $tarball --save-exact
```

Expected: 成功时依赖不再为 `link:`；失败时停止、比较摘要、必要时从备份恢复，绝不放宽 `minimumReleaseAge` 或完整性校验。

- [ ] **Step 2: 验证解耦、路由与文档**

```powershell
node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));const v=p.dependencies?.['dsh-skill-browser']??'';if(v.startsWith('link:'))throw Error('still linked');console.log(v)" (Join-Path $webProfile 'package.json')
dsh --profile web --dump-config | Select-String -Pattern 'dsh-skill-browser|qx-skill-browser'
```

README 说明稳定 `.tgz` 安装与 `web-dev` 链接开发；被策略拒绝时等待，不绕过。

- [ ] **Step 3: 最终验证并提交**

Run: `npm run verify && npm pack --dry-run`

Commit: `完善 DSH 双 Profile 安装流程`，摘要说明稳定 tarball、开发链接、回退与策略限制。
