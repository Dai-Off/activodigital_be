import 'dotenv/config';
import fs from 'fs';
import { AIProcessingService } from './src/domain/services/aiProcessingService';

async function generateTestPdf() {
  const service = new AIProcessingService();
  const buildingData = {
    address: "Calle Mayor 123",
    catastral: "1234567AB1234C0001DE",
    area: "150 m2",
    use: "Residencial"
  };
  const extractedData = {
    documents: [
      { key: "proyecto", label: "Proyecto Técnico", satisfied: true }
    ],
    status_summary: "El usuario ha cumplido los requisitos",
    pem: "15,000 EUR",
    work_description: "Renovación de fachada"
  };

  try {
    const pdfBuffer = await service.generateLicenciaDraft(buildingData, extractedData);
    fs.writeFileSync('/tmp/test_licencia_dr.pdf', pdfBuffer);
    console.log("PDF generado en /tmp/test_licencia_dr.pdf");
  } catch(error) {
    console.error("Error al generar PDF:", error);
  }
}

generateTestPdf();
