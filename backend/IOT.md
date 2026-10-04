# MajiSmart IoT — field device guide

How physical hardware talks to the platform, honestly: real HTTPS ingest
with per-device keys today, MQTT bridge contract for scale tomorrow.

## Architecture

```
[sensor node: ESP32 + probes] --HTTPS POST /api/ingest--> [Render API]
        X-Device-Key: msk_... (per-device 256-bit secret, sha256-stored)
[Render API] --threshold triage--> alerts table (deduplicated per node/6h)
[Render API] --pending_commands--> device (cloud-to-device on next report)
```

- No shared secrets: each device gets its own key, shown ONCE at
  registration (Devices page or `POST /api/devices/register`), revocable via
  Rotate, suspendable without deleting history.
- Keys authenticate DEVICES, never people. Human dashboards keep using JWT.
- Telemetry from hardware lands with `source='device'`; the test simulator
  writes `source='simulator'` — the two can never be confused.

## Provisioning (operator or admin)

1. Register the water point first (Nodes page) — copy its UUID.
2. Devices page → Register device: ID like `MS-KE-0001`, kind, node, firmware.
3. Copy the `msk_…` key into the device firmware as `X-Device-Key`.
4. Device POSTs readings; watch `last seen` turn green within one interval.

## Ingest contract

`POST /api/ingest` — header `X-Device-Key`, JSON body:

```json
{
  "device_id": "MS-KE-0001",
  "firmware": "v1.2.0",
  "readings": {
    "water_level": 62, "flow_rate": 4.2, "turbidity": 1.8,
    "temperature": 23.4, "ph": 7.1, "pressure": 210,
    "tds": 320, "chlorine": 0.4, "battery": 87, "signal": -67
  }
}
```

Accepted ranges are enforced (pH 0–14, turbidity 0–4000 NTU, level 0–100%,
temp −10–60 °C, battery 0–100%, …); out-of-range batches are rejected with
per-field details — never silently stored. Response includes any queued
`commands` (e.g. `{"set_interval": 300}`, `{"valve": "open"}`), delivered
exactly once. Queue commands via `PATCH /api/devices/:id`
`{"config": {"pending_commands": [...]}}`.

Alert thresholds follow WHO/KEBS practice: turbidity > 5 NTU guideline,
> 10 NTU action limit; tank refill below 20%, critical below 10%; zero flow
on an active point; battery below 20%.

## Reference hardware (pilot bill of materials)

- MCU: ESP32-WROOM-32 (deep sleep ~10 µA, Wi-Fi for yard Wi-Fi pilots)
- Connectivity: SIM7600 4G or SIM800L 2G where Wi-Fi is absent; NB-IoT
  (BC66) where Safaricom/Airtel NB coverage exists; LoRaWAN (TTN) for
  valleys with no cellular — gateway posts to /api/ingest on their behalf
  (`kind: 'gateway'`)
- Probes: DFrobot turbidity SEN0189, DS18B20 temperature, analog pH-4502C
  (field-calibrated), YF-S201 flow, HC-SR04/XKC-Y25 level (non-contact),
  0–1.6 MPa pressure transducer
- Power: 20 W solar + 12 V 7 Ah SLA, low-voltage cutoff at 11.4 V
- Enclosure: IP65 box, desiccant, lightning earth on tank installs

## Buffering & offline behavior

Nodes SHOULD buffer readings in SPIFFS/LittleFS when the network drops and
replay oldest-first on reconnect (the API accepts each report's own
timestamp implicitly via arrival order — backfill uses `recorded_at`
server-side; sub-minute ordering is not guaranteed during replay, which is
acceptable for 5–15 min telemetry cadence).

## MQTT bridge (scale path)

At hundreds of devices, put EMQX/Mosquitto in front and bridge topics to
the same contract — no API change needed:

- `majismart/<device_id>/telemetry` → POST /api/ingest (key in payload)
- `majismart/<device_id>/commands` ← poll response commands
- Retain last-will on `majismart/<device_id>/status` → map to
  `PATCH /api/devices/:id {"status": ...}` via a 20-line bridge worker.

## Simulator (no hardware yet)

`node scripts/simulate-device.js --device MS-KE-0001` with `DEVICE_KEY`
set replays diurnal tank behavior through the REAL endpoint. Register that
device with `kind='simulator'` first. Simulator data is quarantined by
source and must never inform billing or compliance views.
