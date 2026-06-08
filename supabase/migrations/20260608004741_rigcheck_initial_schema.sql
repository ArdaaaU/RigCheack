/*
# RigCheck Initial Schema

Short Title: Hardware compatibility platform — full schema + seed data

## Summary
Creates the complete RigCheck database with four feature areas:
1. PC Builder (components reference table + builds table)
2. Live Support Chat (support_threads + support_messages)
3. Benchmark Library (benchmarks table with FPS data)
4. Error Code Dictionary (error_codes reference table)

## New Tables
- components: Hardware parts reference (CPUs, GPUs, RAM, PSUs, Motherboards, SSDs)
- builds: Saved user PC build configurations
- support_threads: Q&A thread headers for live support
- support_messages: Individual messages within support threads
- benchmarks: Community FPS data by game + hardware
- error_codes: Read-only BSOD / POST code reference

## Security
All tables have RLS enabled. anon + authenticated policies allow full CRUD.
error_codes is SELECT-only (reference data, no user inserts).
*/

-- ============================
-- COMPONENTS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('cpu','gpu','ram','psu','motherboard','ssd')),
  name text NOT NULL,
  brand text NOT NULL,
  socket text,
  tdp int,
  memory_type text,
  memory_speed int,
  capacity_gb int,
  psu_wattage int,
  price_usd numeric(10,2),
  specs jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE components ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_components" ON components;
CREATE POLICY "anon_select_components" ON components FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_components" ON components;
CREATE POLICY "anon_insert_components" ON components FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_components" ON components;
CREATE POLICY "anon_update_components" ON components FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_components" ON components;
CREATE POLICY "anon_delete_components" ON components FOR DELETE TO anon, authenticated USING (true);

-- ============================
-- BUILDS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS builds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  components_json jsonb NOT NULL DEFAULT '{}',
  total_tdp int DEFAULT 0,
  total_price numeric(10,2) DEFAULT 0,
  compatibility_ok boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE builds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_builds" ON builds;
CREATE POLICY "anon_select_builds" ON builds FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_builds" ON builds;
CREATE POLICY "anon_insert_builds" ON builds FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_builds" ON builds;
CREATE POLICY "anon_update_builds" ON builds FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_builds" ON builds;
CREATE POLICY "anon_delete_builds" ON builds FOR DELETE TO anon, authenticated USING (true);

-- ============================
-- SUPPORT THREADS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS support_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  hardware_info text,
  author text NOT NULL DEFAULT 'Anonymous',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved')),
  view_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE support_threads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_threads" ON support_threads;
CREATE POLICY "anon_select_threads" ON support_threads FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_threads" ON support_threads;
CREATE POLICY "anon_insert_threads" ON support_threads FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_threads" ON support_threads;
CREATE POLICY "anon_update_threads" ON support_threads FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_threads" ON support_threads;
CREATE POLICY "anon_delete_threads" ON support_threads FOR DELETE TO anon, authenticated USING (true);

-- ============================
-- SUPPORT MESSAGES TABLE
-- ============================
CREATE TABLE IF NOT EXISTS support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES support_threads(id) ON DELETE CASCADE,
  author text NOT NULL DEFAULT 'Anonymous',
  content text NOT NULL,
  is_expert boolean NOT NULL DEFAULT false,
  helpful_count int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_messages_thread ON support_messages(thread_id);

ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_messages" ON support_messages;
CREATE POLICY "anon_select_messages" ON support_messages FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_messages" ON support_messages;
CREATE POLICY "anon_insert_messages" ON support_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_messages" ON support_messages;
CREATE POLICY "anon_update_messages" ON support_messages FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_messages" ON support_messages;
CREATE POLICY "anon_delete_messages" ON support_messages FOR DELETE TO anon, authenticated USING (true);

-- ============================
-- BENCHMARKS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS benchmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_title text NOT NULL,
  cpu_name text NOT NULL,
  gpu_name text NOT NULL,
  resolution text NOT NULL CHECK (resolution IN ('1080p','1440p','4K')),
  quality text NOT NULL CHECK (quality IN ('Low','Medium','High','Ultra')),
  fps_avg numeric(6,1) NOT NULL,
  fps_min numeric(6,1),
  fps_max numeric(6,1),
  submitted_by text DEFAULT 'Community',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_benchmarks_game ON benchmarks(game_title);
CREATE INDEX IF NOT EXISTS idx_benchmarks_gpu ON benchmarks(gpu_name);

ALTER TABLE benchmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_benchmarks" ON benchmarks;
CREATE POLICY "anon_select_benchmarks" ON benchmarks FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_benchmarks" ON benchmarks;
CREATE POLICY "anon_insert_benchmarks" ON benchmarks FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_benchmarks" ON benchmarks;
CREATE POLICY "anon_update_benchmarks" ON benchmarks FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_benchmarks" ON benchmarks;
CREATE POLICY "anon_delete_benchmarks" ON benchmarks FOR DELETE TO anon, authenticated USING (true);

-- ============================
-- ERROR CODES TABLE (read-only)
-- ============================
CREATE TABLE IF NOT EXISTS error_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('bsod','post','beep','other')),
  common_causes text[] DEFAULT '{}',
  solutions text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_error_codes_code ON error_codes(code);

ALTER TABLE error_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_error_codes" ON error_codes;
CREATE POLICY "anon_select_error_codes" ON error_codes FOR SELECT TO anon, authenticated USING (true);

-- ============================
-- SEED: CPUs
-- ============================
INSERT INTO components (type, name, brand, socket, tdp, price_usd, specs)
VALUES
  ('cpu','Core i5-13600K','Intel','LGA1700',125,299.99,'{"cores":14,"threads":20,"boost_ghz":5.1,"base_ghz":3.5}'),
  ('cpu','Core i7-13700K','Intel','LGA1700',253,419.99,'{"cores":16,"threads":24,"boost_ghz":5.4,"base_ghz":3.4}'),
  ('cpu','Core i9-13900K','Intel','LGA1700',253,589.99,'{"cores":24,"threads":32,"boost_ghz":5.8,"base_ghz":3.0}'),
  ('cpu','Core i5-14600K','Intel','LGA1700',181,329.99,'{"cores":14,"threads":20,"boost_ghz":5.3,"base_ghz":3.5}'),
  ('cpu','Ryzen 5 5600X','AMD','AM4',65,199.99,'{"cores":6,"threads":12,"boost_ghz":4.6,"base_ghz":3.7}'),
  ('cpu','Ryzen 7 5800X3D','AMD','AM4',105,349.99,'{"cores":8,"threads":16,"boost_ghz":4.5,"base_ghz":3.4}'),
  ('cpu','Ryzen 7 7700X','AMD','AM5',105,399.99,'{"cores":8,"threads":16,"boost_ghz":5.4,"base_ghz":4.5}'),
  ('cpu','Ryzen 9 7900X','AMD','AM5',170,449.99,'{"cores":12,"threads":24,"boost_ghz":5.6,"base_ghz":4.7}'),
  ('cpu','Ryzen 9 7950X','AMD','AM5',170,699.99,'{"cores":16,"threads":32,"boost_ghz":5.7,"base_ghz":4.5}')
ON CONFLICT DO NOTHING;

-- ============================
-- SEED: GPUs
-- ============================
INSERT INTO components (type, name, brand, tdp, price_usd, specs)
VALUES
  ('gpu','GeForce RTX 4060','NVIDIA',115,299.99,'{"vram_gb":8,"memory_type":"GDDR6","boost_mhz":2460}'),
  ('gpu','GeForce RTX 4070','NVIDIA',200,599.99,'{"vram_gb":12,"memory_type":"GDDR6X","boost_mhz":2475}'),
  ('gpu','GeForce RTX 4070 Ti','NVIDIA',285,799.99,'{"vram_gb":12,"memory_type":"GDDR6X","boost_mhz":2610}'),
  ('gpu','GeForce RTX 4080','NVIDIA',320,1199.99,'{"vram_gb":16,"memory_type":"GDDR6X","boost_mhz":2505}'),
  ('gpu','GeForce RTX 4090','NVIDIA',450,1599.99,'{"vram_gb":24,"memory_type":"GDDR6X","boost_mhz":2520}'),
  ('gpu','Radeon RX 7600','AMD',165,269.99,'{"vram_gb":8,"memory_type":"GDDR6","boost_mhz":2655}'),
  ('gpu','Radeon RX 7700 XT','AMD',245,449.99,'{"vram_gb":12,"memory_type":"GDDR6","boost_mhz":2599}'),
  ('gpu','Radeon RX 7900 XT','AMD',315,899.99,'{"vram_gb":20,"memory_type":"GDDR6","boost_mhz":2394}'),
  ('gpu','Radeon RX 7900 XTX','AMD',355,999.99,'{"vram_gb":24,"memory_type":"GDDR6","boost_mhz":2500}')
ON CONFLICT DO NOTHING;

-- ============================
-- SEED: RAM
-- ============================
INSERT INTO components (type, name, brand, memory_type, memory_speed, capacity_gb, price_usd, specs)
VALUES
  ('ram','Corsair Vengeance 16GB DDR4-3200','Corsair','DDR4',3200,16,54.99,'{"sticks":2}'),
  ('ram','Kingston Fury Beast 16GB DDR4-3600','Kingston','DDR4',3600,16,59.99,'{"sticks":2}'),
  ('ram','G.Skill Ripjaws V 32GB DDR4-3200','G.Skill','DDR4',3200,32,89.99,'{"sticks":2}'),
  ('ram','G.Skill Trident Z5 32GB DDR5-6000','G.Skill','DDR5',6000,32,139.99,'{"sticks":2}'),
  ('ram','Corsair Dominator 32GB DDR5-5600','Corsair','DDR5',5600,32,159.99,'{"sticks":2}'),
  ('ram','Kingston Fury Renegade 64GB DDR5-6000','Kingston','DDR5',6000,64,299.99,'{"sticks":2}')
ON CONFLICT DO NOTHING;

-- ============================
-- SEED: PSUs
-- ============================
INSERT INTO components (type, name, brand, psu_wattage, price_usd, specs)
VALUES
  ('psu','EVGA SuperNOVA 650W Gold','EVGA',650,89.99,'{"efficiency":"80+ Gold","modular":true}'),
  ('psu','Corsair RM750x 750W Gold','Corsair',750,119.99,'{"efficiency":"80+ Gold","modular":true}'),
  ('psu','be quiet! Straight Power 850W Platinum','be quiet!',850,159.99,'{"efficiency":"80+ Platinum","modular":true}'),
  ('psu','EVGA SuperNOVA 1000W Gold','EVGA',1000,189.99,'{"efficiency":"80+ Gold","modular":true}'),
  ('psu','Corsair HX1200 1200W Platinum','Corsair',1200,249.99,'{"efficiency":"80+ Platinum","modular":true}')
ON CONFLICT DO NOTHING;

-- ============================
-- SEED: Motherboards
-- ============================
INSERT INTO components (type, name, brand, socket, memory_type, price_usd, specs)
VALUES
  ('motherboard','ASUS ROG STRIX Z790-E','ASUS','LGA1700','DDR5',449.99,'{"pcie_slots":3,"m2_slots":5}'),
  ('motherboard','MSI MAG Z790 TOMAHAWK','MSI','LGA1700','DDR4',239.99,'{"pcie_slots":3,"m2_slots":4}'),
  ('motherboard','Gigabyte Z790 AORUS Elite AX DDR5','Gigabyte','LGA1700','DDR5',259.99,'{"pcie_slots":3,"m2_slots":4}'),
  ('motherboard','ASUS ROG Crosshair X670E Hero','ASUS','AM5','DDR5',629.99,'{"pcie_slots":3,"m2_slots":5}'),
  ('motherboard','MSI MEG X670E ACE','MSI','AM5','DDR5',559.99,'{"pcie_slots":3,"m2_slots":5}'),
  ('motherboard','ASRock B650M Pro RS','ASRock','AM5','DDR5',169.99,'{"pcie_slots":2,"m2_slots":2}'),
  ('motherboard','MSI PRO B550-A PRO','MSI','AM4','DDR4',129.99,'{"pcie_slots":2,"m2_slots":2}')
ON CONFLICT DO NOTHING;

-- ============================
-- SEED: SSDs
-- ============================
INSERT INTO components (type, name, brand, capacity_gb, price_usd, specs)
VALUES
  ('ssd','Samsung 970 EVO Plus 1TB','Samsung',1000,79.99,'{"read_mbps":3500,"write_mbps":3300,"form_factor":"M.2 NVMe"}'),
  ('ssd','WD Black SN850X 2TB','WD',2000,149.99,'{"read_mbps":7300,"write_mbps":6600,"form_factor":"M.2 NVMe PCIe 4.0"}'),
  ('ssd','Seagate FireCuda 530 1TB','Seagate',1000,99.99,'{"read_mbps":7300,"write_mbps":6900,"form_factor":"M.2 NVMe PCIe 4.0"}'),
  ('ssd','Samsung 990 Pro 2TB','Samsung',2000,169.99,'{"read_mbps":7450,"write_mbps":6900,"form_factor":"M.2 NVMe PCIe 4.0"}')
ON CONFLICT DO NOTHING;

-- ============================
-- SEED: ERROR CODES
-- ============================
INSERT INTO error_codes (code, title, description, category, common_causes, solutions) VALUES
('0x0000007E','SYSTEM_THREAD_EXCEPTION_NOT_HANDLED',
 'A system thread generated an exception that the error handler did not catch. Often caused by a faulty or incompatible driver.',
 'bsod',
 ARRAY['Outdated or corrupted device drivers','Incompatible hardware drivers after an upgrade','Corrupted system files','RAM or storage hardware failure'],
 ARRAY['Update or roll back recently installed drivers','Run System File Checker: sfc /scannow in Command Prompt as admin','Run Windows Memory Diagnostic to test RAM','Check Event Viewer for the exact driver/file causing the error']),
('0x0000003B','SYSTEM_SERVICE_EXCEPTION',
 'An exception occurred while executing a system service routine. A common cause is corrupt memory or a buggy driver.',
 'bsod',
 ARRAY['Faulty RAM sticks','Outdated graphics card driver','Corrupted Windows system files','Third-party antivirus interference'],
 ARRAY['Run MemTest86 overnight to test RAM','Update GPU drivers via manufacturer site','Run DISM /Online /Cleanup-Image /RestoreHealth','Boot into Safe Mode to isolate third-party software']),
('0x0000001A','MEMORY_MANAGEMENT',
 'A severe memory management error occurred. This usually points to faulty RAM or RAM that is not compatible with the motherboard.',
 'bsod',
 ARRAY['Defective RAM module','RAM running at unsupported XMP/DOCP speeds','Incompatible RAM sticks mixed together','Corrupted virtual memory settings'],
 ARRAY['Test each RAM stick individually','Disable XMP/DOCP profile in BIOS and run at stock speeds','Ensure RAM modules are installed in correct dual-channel slots','Increase virtual memory in Windows Performance settings']),
('0x000000D1','DRIVER_IRQL_NOT_LESS_OR_EQUAL',
 'A driver tried to access memory at an invalid IRQL. This is almost always a driver bug, especially after driver updates.',
 'bsod',
 ARRAY['Recently updated or installed driver','Network adapter driver issues','Corrupt existing driver files','Malware interfering with driver operations'],
 ARRAY['Note the filename shown on the BSOD screen and update that specific driver','Roll back the most recently updated driver','Use Driver Verifier to identify the problematic driver','Scan for malware with Windows Defender']),
('0x0000009F','DRIVER_POWER_STATE_FAILURE',
 'A driver is in an inconsistent or invalid power state. Often triggered during sleep/wake cycles.',
 'bsod',
 ARRAY['Power management driver bugs','USB device drivers failing during sleep','Outdated chipset or power management drivers','Hibernate or fast startup issues'],
 ARRAY['Update chipset drivers from motherboard manufacturer website','Disable Fast Startup in Windows Power Settings','Update USB controller drivers','Run powercfg /energy to generate a power efficiency diagnostics report']),
('0xC000021A','STATUS_SYSTEM_PROCESS_TERMINATED',
 'A critical system process (winlogon.exe or csrss.exe) terminated unexpectedly. Windows cannot recover and must restart.',
 'bsod',
 ARRAY['Corrupted system files (winlogon or csrss)','Third-party software modifying system processes','Incomplete Windows Update','Virus or rootkit infection'],
 ARRAY['Boot from Windows installation media and run Startup Repair','Run sfc /scannow and DISM /Online /Cleanup-Image /RestoreHealth','Perform a System Restore to a prior working state','Run a full offline antivirus scan']),
('WHEA_UNCORRECTABLE_ERROR','WHEA_UNCORRECTABLE_ERROR — Hardware Error',
 'Windows Hardware Error Architecture detected a hardware failure. Can be CPU, RAM, or storage.',
 'bsod',
 ARRAY['CPU overclocking instability','Failing CPU or RAM','Outdated BIOS','Failing storage device'],
 ARRAY['Disable any CPU or memory overclocking (reset BIOS to defaults)','Update BIOS to the latest version','Run chkdsk /f /r to check storage health','Monitor CPU temperatures to rule out thermal issues']),
('KERNEL_SECURITY_CHECK_FAILURE','KERNEL_SECURITY_CHECK_FAILURE',
 'A kernel security check found a data structure corruption. Often related to outdated drivers or incompatible software.',
 'bsod',
 ARRAY['Outdated drivers incompatible with current Windows version','Overclocking causing memory corruption','Third-party security software','Corrupted system files'],
 ARRAY['Update all drivers especially GPU, network, and chipset','Disable overclocking in BIOS','Uninstall recently installed security or antivirus software','Boot to Safe Mode and run SFC and DISM repair tools']),
('POST_A2','POST Code A2 — Storage Init Failure',
 'Motherboard debug LED showing A2 indicates the BIOS is failing to detect or initialize a storage device (NVMe/SATA).',
 'post',
 ARRAY['M.2 SSD not seated properly','NVMe drive not detected (wrong slot)','BIOS needs update for NVMe compatibility','SATA cable disconnected or faulty'],
 ARRAY['Re-seat the M.2 SSD firmly and ensure the retention screw is tight','Try the M.2 drive in a different slot','Update BIOS to latest version from manufacturer','Check SATA data and power cables']),
('POST_55','POST Code 55 — Memory Not Installed',
 'Motherboard debug LED showing 55 means no memory detected. RAM is not installed correctly or is incompatible.',
 'post',
 ARRAY['RAM not fully seated in slots','RAM installed in wrong slots (not recommended A2/B2)','Incompatible RAM kit','Bent CPU socket pins (AMD)'],
 ARRAY['Remove and firmly re-seat RAM sticks (listen for click)','Move RAM to manufacturer-recommended slots (usually A2+B2)','Test with a single stick in the primary slot','Inspect CPU socket for bent pins']),
('POST_d0','POST Code d0 — CPU Not Detected',
 'Debug LED d0 means the BIOS cannot initialize the CPU. Serious hardware or seating issue.',
 'post',
 ARRAY['CPU not fully seated in socket','CPU power connectors (4+4 pin) not connected','BIOS not compatible with CPU (needs update)','Bent socket pins or damaged CPU'],
 ARRAY['Power off, remove CPU, and re-seat carefully aligning the triangle marker','Ensure all CPU power connectors (4+4 or 8 pin) are firmly connected','Flash BIOS using USB BIOS Flashback if the board supports older CPU first','Inspect LGA socket pins for damage with a flashlight']),
('BEEP_1L2S','1 Long + 2 Short Beeps — Video Card Error',
 'Award/AMI BIOS beep code indicating the GPU is not detected or has failed POST.',
 'beep',
 ARRAY['GPU not properly seated in PCIe slot','PCIe power connectors not connected to GPU','GPU failure','Incompatible or failed PCIe slot'],
 ARRAY['Re-seat the GPU firmly in the PCIe x16 slot','Connect all required PCIe power cables to the GPU','Test GPU in another PCIe slot','Test with a different GPU or integrated graphics if available'])
ON CONFLICT (code) DO NOTHING;

-- ============================
-- SEED: SUPPORT THREADS + MESSAGES
-- ============================
DO $$
DECLARE
  t1_id uuid;
  t2_id uuid;
  t3_id uuid;
BEGIN
  INSERT INTO support_threads (title, hardware_info, author, status)
  VALUES ('Is RTX 4070 enough for 1440p 144Hz gaming?',
          'CPU: Ryzen 7 5800X3D | RAM: 32GB DDR4-3600 | Current GPU: RX 580 | Monitor: 1440p 144Hz',
          'PixelHunter', 'open')
  RETURNING id INTO t1_id;

  INSERT INTO support_messages (thread_id, author, content, is_expert) VALUES
    (t1_id, 'PixelHunter', 'Hey everyone! I currently have an RX 580 and want to upgrade to 1440p gaming at 144Hz. Is the RTX 4070 a good choice or should I go for the 4070 Ti? Budget is around $600.', false),
    (t1_id, 'TechWizard_Pro', 'The RTX 4070 is excellent for 1440p 144Hz. In most AAA titles you will hit 100-144 FPS on High/Ultra settings. The 4070 Ti gives you ~20% more performance but costs $200 more — only worth it if you want consistently 144+ fps at Ultra. With your 5800X3D there will be zero CPU bottleneck. Go for the 4070.', true),
    (t1_id, 'PixelHunter', 'That is exactly what I needed to hear. Does DLSS help much at 1440p?', false),
    (t1_id, 'TechWizard_Pro', 'DLSS 3 on the 40 series cards is fantastic at 1440p. Quality mode is nearly indistinguishable from native and gives you an easy 30-40% FPS boost. With DLSS Quality you can basically guarantee 144+ fps in almost any game.', true);

  INSERT INTO support_threads (title, hardware_info, author, status)
  VALUES ('BSOD MEMORY_MANAGEMENT after adding new RAM kit',
          'CPU: Intel i7-13700K | MB: MSI MAG Z790 | Old RAM: 16GB DDR5-4800 | New RAM: 32GB DDR5-6000',
          'BuildBreaker22', 'resolved')
  RETURNING id INTO t2_id;

  INSERT INTO support_messages (thread_id, author, content, is_expert) VALUES
    (t2_id, 'BuildBreaker22', 'I upgraded from 16GB to 32GB DDR5. Kept my old sticks and added two new ones (different brand, both DDR5-6000). Now getting MEMORY_MANAGEMENT BSOD every few hours. Help!', false),
    (t2_id, 'RamExpert', 'Mixing RAM kits is a very common cause of MEMORY_MANAGEMENT errors. Even if both are DDR5-6000, different manufacturers use different ICs and the memory controller struggles to maintain stability across all four sticks. Remove old sticks and test with only the new 32GB kit.', true),
    (t2_id, 'BuildBreaker22', 'Tested with only the new kit — completely stable for 12 hours. You nailed it. Marking as resolved!', false);

  INSERT INTO support_threads (title, hardware_info, author, status)
  VALUES ('PC turns on but no display — debug LED shows A2',
          'New build: Ryzen 9 7950X | ASUS ROG Crosshair X670E | 64GB DDR5 | WD Black SN850X 2TB',
          'FirstTimerBuild', 'open')
  RETURNING id INTO t3_id;

  INSERT INTO support_messages (thread_id, author, content, is_expert) VALUES
    (t3_id, 'FirstTimerBuild', 'Just finished my first ever PC build. Fans spin, RGB lights up, but no display at all. The debug LED on my motherboard shows A2. I have never built before so not sure what this means. Monitor cable is definitely plugged in.', false),
    (t3_id, 'HardwareSensei', 'A2 is a storage initialization code — your BIOS is booting but cannot find the storage device. Very common on first builds. Check: 1) Make sure the M.2 SSD is fully seated and the retention screw is tight. 2) Confirm the SSD is in the primary M.2 slot. 3) Check if your BIOS needs an update for your SSD.', true),
    (t3_id, 'FirstTimerBuild', 'The M.2 screw was not tightened — the drive was slightly lifted! Fixed it and now getting to BIOS. But no Windows, it says bootable device not found.', false),
    (t3_id, 'HardwareSensei', 'Great progress! Since it is a new drive there is no OS yet. Download the Windows 11 Media Creation Tool on another PC, create a bootable USB, plug it into your new build, and boot from USB. The BIOS should show it as a boot option.', true);
END $$;

-- ============================
-- SEED: BENCHMARKS
-- ============================
INSERT INTO benchmarks (game_title, cpu_name, gpu_name, resolution, quality, fps_avg, fps_min, fps_max, submitted_by) VALUES
  ('Cyberpunk 2077','Ryzen 9 7950X','GeForce RTX 4090','4K','Ultra',87.3,62.1,114.5,'BenchmarkBot'),
  ('Cyberpunk 2077','Ryzen 9 7950X','GeForce RTX 4090','1440p','Ultra',135.2,98.4,178.3,'BenchmarkBot'),
  ('Cyberpunk 2077','Core i7-13700K','GeForce RTX 4080','1440p','Ultra',118.7,87.2,155.8,'CommunityUser1'),
  ('Cyberpunk 2077','Core i7-13700K','GeForce RTX 4070','1440p','High',97.4,71.3,127.6,'CommunityUser1'),
  ('Cyberpunk 2077','Ryzen 7 5800X3D','GeForce RTX 4070','1080p','Ultra',121.8,91.2,158.4,'SpeedTester'),
  ('Cyberpunk 2077','Ryzen 7 5800X3D','Radeon RX 7900 XTX','1440p','High',109.5,79.8,142.3,'SpeedTester'),
  ('Elden Ring','Core i5-13600K','GeForce RTX 4070','1440p','High',118.0,60.0,120.0,'SoulsRunner'),
  ('Elden Ring','Ryzen 5 5600X','GeForce RTX 4060','1080p','High',116.5,58.3,120.0,'SoulsRunner'),
  ('Call of Duty: Warzone 2','Core i9-13900K','GeForce RTX 4090','1440p','Ultra',278.4,198.3,342.1,'FPSKing'),
  ('Call of Duty: Warzone 2','Core i5-13600K','GeForce RTX 4070','1440p','High',196.8,142.3,251.4,'FPSKing'),
  ('Call of Duty: Warzone 2','Ryzen 7 7700X','GeForce RTX 4060','1080p','High',218.4,155.7,285.3,'FPSKing'),
  ('Spider-Man: Miles Morales','Core i7-13700K','GeForce RTX 4080','4K','Ultra',89.4,68.2,112.8,'PCPerfect'),
  ('Spider-Man: Miles Morales','Ryzen 9 7900X','Radeon RX 7900 XTX','1440p','Ultra',134.7,98.4,172.3,'PCPerfect'),
  ('Spider-Man: Miles Morales','Core i5-13600K','GeForce RTX 4070 Ti','1440p','High',147.2,108.4,189.3,'PCPerfect'),
  ('Red Dead Redemption 2','Ryzen 7 5800X3D','GeForce RTX 4090','4K','Ultra',78.3,54.2,98.7,'WildWestGamer'),
  ('Red Dead Redemption 2','Core i9-13900K','GeForce RTX 4080','1440p','Ultra',112.4,82.3,145.6,'WildWestGamer'),
  ('Red Dead Redemption 2','Ryzen 5 5600X','GeForce RTX 4070','1080p','High',124.8,88.9,157.2,'WildWestGamer'),
  ('The Witcher 3 Next-Gen','Ryzen 9 7950X','GeForce RTX 4090','4K','Ultra',124.3,91.2,158.4,'WitcherFan'),
  ('The Witcher 3 Next-Gen','Core i7-13700K','GeForce RTX 4070 Ti','1440p','Ultra',156.8,118.4,198.2,'WitcherFan'),
  ('Hogwarts Legacy','Ryzen 7 7700X','Radeon RX 7900 XT','1440p','High',89.3,64.8,117.4,'HogwartsPlayer'),
  ('Hogwarts Legacy','Core i5-13600K','GeForce RTX 4070','1080p','High',112.7,82.3,145.8,'HogwartsPlayer'),
  ('Counter-Strike 2','Core i5-13600K','GeForce RTX 4060','1080p','High',387.4,254.3,521.8,'CSGO_Pro'),
  ('Counter-Strike 2','Ryzen 5 5600X','GeForce RTX 4070','1440p','High',312.8,218.4,418.3,'CSGO_Pro')
ON CONFLICT DO NOTHING;
