import {BaseEntityAPI} from "@/common/api/BaseEntityAPI"

// Define types for system-related responses
export interface SystemStatus {
  appName: string;
  instanceName: string;
  version: string;
  buildTime: string; // ISO8601 formatted date-time string
  isDebug: boolean;
  isProduction: boolean;
  isAdmin: boolean;
  isUserInteractive: boolean;
  startupPath: string;
  appData: string;
  osName: string;
  osVersion: string;
  isNetCore: boolean;
  isLinux: boolean;
  isOsx: boolean;
  isWindows: boolean;
  isDocker: boolean;
  mode: string; // "console" or other modes as applicable
  branch: string;
  databaseType: string; // e.g., "sqLite", "mySQL", etc.
  databaseVersion: string;
  authentication: string; // e.g., "none", "basic", "token"
  migrationVersion: number;
  urlBase: string;
  runtimeVersion: string;
  runtimeName: string;
  startTime: string; // ISO8601 formatted date-time string
  packageVersion: string;
  packageAuthor: string;
  packageUpdateMechanism: string; // e.g., "builtIn", "manual"
  packageUpdateMechanismMessage: string;
}

export class SystemAPI extends BaseEntityAPI {
  // Method to get system status
  async getStatus() {
    return await this._get<SystemStatus, any>("system/status")
  }
}
