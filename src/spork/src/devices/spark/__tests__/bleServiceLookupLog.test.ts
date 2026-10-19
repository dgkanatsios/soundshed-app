import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BleProvider } from "../bleProvider";

// A trace from a Spark 2 showed only "Service discovery failed for 0000ffc8-...: {}",
// because JSON.stringify drops a DOMException's name and message. That could not tell a
// missing FFC8 service apart from a lookup that failed for another reason.

const FFC8 = "0000ffc8-0000-1000-8000-00805f9b34fb";
const FFC0 = "0000ffc0-0000-1000-8000-00805f9b34fb";
const GENERIC_ACCESS = "00001800-0000-1000-8000-00805f9b34fb";

function makeProvider(listServices: () => Promise<{ uuid: string }[]>) {
    const provider: any = new BleProvider();
    const characteristic = {
        writeValueWithoutResponse: async () => { },
        startNotifications: async () => { },
        stopNotifications: async () => { },
        addEventListener: () => { },
        removeEventListener: () => { }
    };

    provider.selectedDevice = {
        name: "Spark 2 BLE",
        id: "test-id",
        addEventListener: () => { },
        removeEventListener: () => { },
        gatt: { connect: async () => provider.server }
    };

    provider.server = {
        connected: true,
        getPrimaryService: async (uuid: string) => {
            if (uuid === FFC8) {
                throw new DOMException(`No Services matching UUID ${FFC8} found in Device.`, "NotFoundError");
            }
            return { getCharacteristic: async () => characteristic };
        },
        getPrimaryServices: listServices
    };

    return provider;
}

const connect = (provider: any) => provider.connect({ name: "Spark 2 BLE", address: "test-id", port: null });

describe("logging a failed GATT service lookup", () => {
    let warn: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        warn = vi.spyOn(console, "warn").mockImplementation(() => { });
    });

    afterEach(() => {
        warn.mockRestore();
    });

    const warnings = () => warn.mock.calls.map(c => String(c[0]));

    it("names the error instead of logging {}", async () => {
        await connect(makeProvider(async () => []));

        const line = warnings().find(m => m.includes("Service discovery failed"));
        expect(line).toBe(`[BLE Provider] : Service discovery failed for ${FFC8}: NotFoundError: No Services matching UUID ${FFC8} found in Device.`);
    });

    it("lists the services the page can see on the device", async () => {
        await connect(makeProvider(async () => [{ uuid: GENERIC_ACCESS }, { uuid: FFC0 }]));

        expect(warnings()).toContain(`[BLE Provider] : Services visible to this page: ${GENERIC_ACCESS}, ${FFC0}`);
    });

    it("still falls back to FFC0 when the service list cannot be read", async () => {
        const provider = makeProvider(async () => { throw new DOMException("GATT Server is disconnected.", "NetworkError"); });

        expect(await connect(provider)).toBe(true);
        expect(provider.isSpark2Connection()).toBe(true);
        expect(warnings()).toContain("[BLE Provider] : Could not list the device's services: NetworkError: GATT Server is disconnected.");
    });
});
