import React, { useRef } from 'react';
import { Modal, Button, Typography, Space, Divider } from 'antd';
import { PrinterOutlined, DownloadOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { QRCodeSVG } from 'qrcode.react';

const { Title, Text } = Typography;

interface ShopQrModalProps {
  open: boolean;
  onClose: () => void;
  shop: any | null;
  qrPayload?: string | null;
}

export const ShopQrModal: React.FC<ShopQrModalProps> = ({ open, onClose, shop, qrPayload }) => {
  const qrRef = useRef<SVGSVGElement>(null);

  if (!shop || !qrPayload) return null;

  const handleDownload = () => {
    if (!qrRef.current) return;
    const svgData = new XMLSerializer().serializeToString(qrRef.current);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Add some padding and white background
      canvas.width = img.width + 40;
      canvas.height = img.height + 40;
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 20, 20);
      }
      
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `QR_${shop.name.replace(/\\s+/g, '_')}.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handlePrint = () => {
    if (!qrRef.current) return;
    const svgData = new XMLSerializer().serializeToString(qrRef.current);
    
    const printWindow = window.open('', '', 'width=600,height=800');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Code - ${shop.name}</title>
          <style>
            body { 
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              text-align: center;
            }
            .card {
              border: 2px dashed #ccc;
              padding: 40px;
              border-radius: 12px;
            }
            h1 { margin: 0 0 8px 0; font-size: 24px; }
            p { margin: 0 0 24px 0; color: #666; }
            svg { max-width: 100%; height: auto; }
            @media print {
              body { height: auto; }
              .card { border: none; padding: 0; }
              @page { margin: 20mm; }
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>${shop.name}</h1>
            <p>${shop.area || ''} ${shop.route ? `• ${shop.route}` : ''}</p>
            ${svgData}
            <p style="margin-top: 16px; font-size: 12px; color: #999;">SpiceFlow Shop ID: ${shop.id}</p>
          </div>
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title="Shop QR Code"
      width={400}
      centered
    >
      <div className="flex flex-col items-center justify-center p-4">
        <Title level={4} className="!mb-1 text-center">{shop.name}</Title>
        <Space className="text-slate-400 mb-6">
          <EnvironmentOutlined />
          <Text type="secondary">{shop.area} {shop.route ? `(${shop.route})` : ''}</Text>
        </Space>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
          <QRCodeSVG
            value={qrPayload}
            size={200}
            bgColor={"#ffffff"}
            fgColor={"#000000"}
            level={"M"}
            includeMargin={false}
            ref={qrRef}
          />
        </div>

        <Text type="secondary" className="text-xs mb-6 break-all text-center px-4 font-mono">
          {qrPayload}
        </Text>

        <Divider className="my-2" />

        <div className="flex w-full gap-3 mt-4">
          <Button 
            className="flex-1"
            icon={<DownloadOutlined />}
            onClick={handleDownload}
          >
            Download
          </Button>
          <Button 
            type="primary"
            className="flex-1 bg-emerald-600 hover:bg-emerald-500"
            icon={<PrinterOutlined />}
            onClick={handlePrint}
          >
            Print Sticker
          </Button>
        </div>
      </div>
    </Modal>
  );
};
