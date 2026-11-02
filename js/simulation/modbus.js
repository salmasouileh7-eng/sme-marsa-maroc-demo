/**
 * modbus.js - Simulateur de couche protocolaire Modbus TCP/IP
 * Gère les sockets simulés, les tables de registres (Holding Registers), 
 * les conversions flottantes 32 bits IEEE 754 Big-Endian et le buffer de coupure.
 */

export class ModbusTCPSimulator {
  /**
   * Convertit un nombre flottant JavaScript en deux registres 16 bits (Big-Endian IEEE 754)
   * @param {number} value 
   * @returns {[number, number]} Deux entiers 16 bits non signés
   */
  static float32ToRegisters(value) {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setFloat32(0, value, false); // Big-Endian
    const reg1 = view.getUint16(0, false);
    const reg2 = view.getUint16(2, false);
    return [reg1, reg2];
  }

  /**
   * Reconstitue un flottant 32 bits depuis 2 registres 16 bits
   * @param {number} reg1 
   * @param {number} reg2 
   * @returns {number}
   */
  static registersToFloat32(reg1, reg2) {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setUint16(0, reg1, false);
    view.setUint16(2, reg2, false);
    return view.getFloat32(0, false);
  }

  /**
   * Simule une requête de lecture Modbus Read Holding Registers (Function Code 0x03)
   * @param {Object} meterConfig Configuration réseau du compteur
   * @param {Object} rawValues Valeurs électriques actuelles non encodées
   * @param {boolean} isCut Indique si la liaison physique est coupée
   * @returns {Promise<Object>} Trame de réponse avec registres ou timeout
   */
  static async queryMeter(meterConfig, rawValues, isCut = false) {
    // Latence réseau simulée (15ms à 45ms sur un switch industriel OT)
    const latency = Math.floor(15 + Math.random() * 30);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        if (isCut) {
          resolve({
            success: false,
            error: "ERR_MODBUS_TIMEOUT",
            message: `Délai d'attente dépassé (> ${meterConfig.reseau.timeoutMs} ms) pour l'esclave ${meterConfig.reseau.ip}:${meterConfig.reseau.port} [UnitID: ${meterConfig.reseau.unitId}]`,
            latencyMs: meterConfig.reseau.timeoutMs
          });
          return;
        }

        // Construction du dictionnaire de registres
        const registerMap = {};
        for (const reg of meterConfig.registres) {
          const val = rawValues[reg.grandeur] !== undefined ? rawValues[reg.grandeur] : 0;
          // Valeur brute dans l'automate avant facteur d'échelle
          const unscaledVal = reg.echelle !== 0 ? val / reg.echelle : val;
          const [r1, r2] = this.float32ToRegisters(unscaledVal);
          registerMap[reg.adresse] = r1;
          registerMap[reg.adresse + 1] = r2;
        }

        resolve({
          success: true,
          ip: meterConfig.reseau.ip,
          port: meterConfig.reseau.port,
          unitId: meterConfig.reseau.unitId,
          registers: registerMap,
          latencyMs: latency,
          timestamp: new Date().toISOString()
        });
      }, latency);
    });
  }
}
