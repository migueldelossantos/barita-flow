declare module "qrcode" {
  export interface QRCodeToDataURLOptions {
    width?: number;
    margin?: number;
    errorCorrectionLevel?: "L" | "M" | "Q" | "H";
    color?: {
      dark?: string;
      light?: string;
    };
  }

  export interface QRCodeStatic {
    toDataURL(
      text: string,
      options?: QRCodeToDataURLOptions
    ): Promise<string>;
  }

  const QRCode: QRCodeStatic;
  export default QRCode;
}
