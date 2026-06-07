/**
 * In-app purchase via RevenueCat (Section 11). Apple IAP is required for the
 * in-app Pro unlock. The "pro" entitlement gates full analytics, unlimited
 * villain notes, the full range library, quiz trainer, and data export.
 *
 * Pricing (monthly + annual, annual discounted) is configured in App Store
 * Connect and surfaced through RevenueCat offerings - never hardcoded here.
 */
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import Purchases, { PurchasesOffering, CustomerInfo } from 'react-native-purchases';

const ENTITLEMENT_ID = 'pro';

let _configured = false;

export function configurePurchases(): boolean {
  if (_configured) return true;
  const iosKey = Constants.expoConfig?.extra?.revenueCatIosKey as string | undefined;
  const androidKey = Constants.expoConfig?.extra?.revenueCatAndroidKey as string | undefined;
  const key = Platform.OS === 'ios' ? iosKey : androidKey;
  if (!key || key.startsWith('REPLACE_')) {
    // Not yet wired (e.g. running before keys are set). Fail soft.
    return false;
  }
  try {
    Purchases.configure({ apiKey: key });
    _configured = true;
    return true;
  } catch {
    return false;
  }
}

export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  if (!configurePurchases()) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current ?? null;
  } catch {
    return null;
  }
}

export function hasPro(info: CustomerInfo | null): boolean {
  if (!info) return false;
  return info.entitlements.active[ENTITLEMENT_ID] !== undefined;
}

export async function refreshEntitlement(): Promise<boolean> {
  if (!configurePurchases()) return false;
  try {
    const info = await Purchases.getCustomerInfo();
    return hasPro(info);
  } catch {
    return false;
  }
}

export async function purchasePackageById(packageIdentifier: string): Promise<boolean> {
  if (!configurePurchases()) return false;
  const offering = await getCurrentOffering();
  const pkg = offering?.availablePackages.find((p) => p.identifier === packageIdentifier);
  if (!pkg) return false;
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return hasPro(customerInfo);
  } catch {
    return false;
  }
}

export async function restorePurchases(): Promise<boolean> {
  if (!configurePurchases()) return false;
  try {
    const info = await Purchases.restorePurchases();
    return hasPro(info);
  } catch {
    return false;
  }
}
