import type { FlightRow, AlertEntry, Report } from "@/app/api/analyze/route";

export interface StoredCertificate {
  id: string;               // e.g. DC-BC721FEC
  generatedAt: string;      // ISO datetime

  // Drone identity
  droneModel: string;
  droneSerial: string;
  batterySerial: string;

  // Score
  score: number;            // 0–100
  scoreLabel: string;       // "Excelente" | "Bueno" | "Aceptable" | "Requiere Revisión"
  scoreColor: "Verde" | "Amarillo" | "Rojo";
  confidence: string;       // "Alta" | "Media" | "Baja"
  verdict: string;          // e.g. "Sin señales de riesgo relevantes."

  // Usage summary
  totalFlights: number;
  totalFlightTime: string;  // formatted, e.g. "4h 32m"
  totalDistance: string;    // formatted, e.g. "142.3 km"
  firstFlightDate: string;  // YYYY-MM-DD or "—"
  lastFlightDate: string;

  // Battery
  cellImbalance: number;    // V — max deviation
  maxTemp: number;          // °C
  currentCapacity: number;  // mAh
  originalCapacity: number; // mAh
  degradation: number;      // %
  dischargeCycles: number;

  // Reliability
  flightsWithEvents: string; // "2 / 15"
  signalLoss: number;
  failsafe: number;
  forcedLandings: number;
  lowBatteryAlerts: number;

  // Recent flights table
  recentFlights: FlightRow[];

  // Alerts
  alerts: AlertEntry[];

  // AI summary (or fallback)
  aiSummary: string;

  // Bullet conclusions (from findings[])
  conclusions: string[];

  // Original report — kept for PDF regeneration
  report: Report;
}
