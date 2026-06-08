import type { LicenseType } from "../enums";

export interface Company {
  id: string;
  name: string;
  phone: string;
  licenseType: LicenseType;
  licenseExpiresAt: string;
  isSetupComplete: boolean;
}

export interface CompanyProfile {
  companyId: string;
  slogan: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  whatsappPhone: string | null;
  transferOwnerName: string | null;
  transferBank: string | null;
  transferClabe: string | null;
}

export interface CompanyWithProfile extends Company {
  profile: CompanyProfile | null;
}
