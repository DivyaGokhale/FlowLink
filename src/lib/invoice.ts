// Utility function for generating PDF invoice
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { formatPrice } from './utils';

export const generateInvoicePDF = (order: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Add header
  doc.setFontSize(20);
  doc.text('Invoice', pageWidth / 2, 20, { align: 'center' });
  
  // Add logo or company name
  doc.setFontSize(12);
  doc.text('FlowLink', pageWidth / 2, 30, { align: 'center' });
  
  // Add order information
  doc.setFontSize(10);
  doc.text(`Order ID: ${order._id}`, 15, 50);
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 15, 57);
  doc.text(`Payment Method: ${order.payment.method}`, 15, 64);
  
  // Add shipping address
  doc.text('Shipping Address:', 15, 80);
  doc.text(`${order.shippingAddress.name}`, 15, 87);
  doc.text(`${order.shippingAddress.line1}`, 15, 94);
  if (order.shippingAddress.line2) {
    doc.text(`${order.shippingAddress.line2}`, 15, 101);
  }
  doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}`, 15, 108);
  doc.text(`Phone: ${order.shippingAddress.phone}`, 15, 115);
  
  // Add items table
  const tableData = order.items.map((item: any) => [
    item.name,
    item.quantity,
    formatPrice(item.price),
    formatPrice(item.price * item.quantity)
  ]);
  
  // Add table
  (doc as any).autoTable({
    startY: 130,
    head: [['Item', 'Quantity', 'Price', 'Total']],
    body: tableData,
  });
  
  // Add totals
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.text(`Subtotal: ${formatPrice(order.totals.subtotal)}`, pageWidth - 60, finalY + 10);
  doc.text(`GST (5%): ${formatPrice(order.totals.gst)}`, pageWidth - 60, finalY + 17);
  doc.text(`Delivery: ${formatPrice(order.totals.delivery)}`, pageWidth - 60, finalY + 24);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total: ${formatPrice(order.totals.total)}`, pageWidth - 60, finalY + 31);
  
  return doc;
};