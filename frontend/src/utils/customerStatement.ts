const formatAmount = (value: number, currency: string) => `${currency}${Number(value || 0).toFixed(2)}`;

export async function createCustomerStatementImage(
  customer: any,
  debts: any[],
  payments: any[],
  businessName: string,
  currency: string,
) {
  const recentPayments = payments.slice(0, 12);
  const width = 600;
  const margin = 32;
  const contentWidth = width - margin * 2;
  const debtRowHeight = 42;
  const paymentRowHeight = 38;
  const height = 660 + debts.length * debtRowHeight + recentPayments.length * paymentRowHeight;
  const scale = 2;
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('PNG canvas is unavailable');
  context.scale(scale, scale);

  const roundedRect = (x: number, y: number, w: number, h: number, radius: number, color: string) => {
    context.fillStyle = color;
    context.beginPath();
    context.roundRect(x, y, w, h, radius);
    context.fill();
  };
  const text = (
    value: string,
    x: number,
    y: number,
    options: { size?: number; color?: string; weight?: number; align?: CanvasTextAlign; maxWidth?: number } = {},
  ) => {
    context.font = `${options.weight || 400} ${options.size || 13}px Arial, sans-serif`;
    context.fillStyle = options.color || '#334155';
    context.textAlign = options.align || 'left';
    context.fillText(value, x, y, options.maxWidth);
  };
  const separator = (y: number) => {
    context.strokeStyle = '#e2e8f0';
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(margin, y);
    context.lineTo(width - margin, y);
    context.stroke();
  };

  context.fillStyle = '#f1f5f9';
  context.fillRect(0, 0, width, height);
  roundedRect(12, 12, width - 24, height - 24, 18, '#ffffff');
  roundedRect(12, 12, width - 24, 122, 18, '#142746');
  context.fillStyle = '#142746';
  context.fillRect(12, 112, width - 24, 22);

  const logo = new Image();
  logo.src = '/logo.png';
  try {
    await logo.decode();
    roundedRect(width - 166, 25, 136, 74, 10, '#ffffff');
    context.drawImage(logo, width - 162, 28, 128, 68);
  } catch (error) {
    console.warn('Maraayn logo could not be loaded for the statement image.', error);
  }

  text(businessName || 'Maraayn', margin, 52, { size: 22, color: '#ffffff', weight: 700, maxWidth: 370 });
  text('WAR-BIXINTA XISAABTA MACMIILKA', margin, 86, { size: 17, color: '#f8c76a', weight: 700 });
  text(`Taariikhda: ${new Date().toLocaleDateString('so-SO')}`, width - margin, 111, {
    size: 11,
    color: '#dbeafe',
    align: 'right',
  });

  text(customer.name || '-', margin, 169, { size: 21, color: '#142746', weight: 700, maxWidth: contentWidth });
  text(`Lambarka macmiilka: ${customer.code || '-'}`, margin, 198, { size: 12, color: '#64748b' });
  text(`Telefoon: ${customer.phone || '-'}`, margin, 220, { size: 12, color: '#64748b' });

  const summaryY = 242;
  const gap = 10;
  const summaryWidth = (contentWidth - gap * 2) / 3;
  const summaries = [
    { label: 'Wadarta wax iibsiga', value: formatAmount(customer.totalPurchases, currency), fill: '#eff6ff' },
    { label: 'Lacagta la bixiyay', value: formatAmount(customer.totalPaid, currency), fill: '#ecfdf5' },
    { label: 'Daynta dhiman', value: formatAmount(customer.currentDebtBalance, currency), fill: '#fff1f2' },
  ];
  summaries.forEach((item, index) => {
    const x = margin + index * (summaryWidth + gap);
    roundedRect(x, summaryY, summaryWidth, 72, 10, item.fill);
    text(item.label, x + 12, summaryY + 25, { size: 10, color: '#64748b', weight: 600, maxWidth: summaryWidth - 20 });
    text(item.value, x + 12, summaryY + 53, { size: 17, color: '#142746', weight: 700, maxWidth: summaryWidth - 20 });
  });

  let y = 352;
  text('DIIWAANKA DAYMAHA', margin, y, { size: 13, color: '#142746', weight: 700 });
  y += 15;
  roundedRect(margin, y, contentWidth, 34, 6, '#142746');
  const debtColumns = [margin + 10, margin + 168, margin + 254, margin + 348, margin + 450];
  text('Dayn / Taariikh', debtColumns[0], y + 22, { size: 9, color: '#ffffff', weight: 700 });
  text('Wadarta', debtColumns[1], y + 22, { size: 9, color: '#ffffff', weight: 700 });
  text('La bixiyay', debtColumns[2], y + 22, { size: 9, color: '#ffffff', weight: 700 });
  text('Hadhay', debtColumns[3], y + 22, { size: 9, color: '#ffffff', weight: 700 });
  text('Xaalad', debtColumns[4], y + 22, { size: 9, color: '#ffffff', weight: 700 });
  y += 34;

  if (debts.length) {
    debts.forEach((debt, index) => {
      if (index % 2 === 0) roundedRect(margin, y, contentWidth, debtRowHeight, 4, '#f8fafc');
      text(debt.debtNumber || '-', debtColumns[0], y + 17, { size: 9, color: '#1e293b', weight: 700 });
      text(debt.createdAt ? new Date(debt.createdAt).toLocaleDateString('so-SO') : '-', debtColumns[0], y + 32, { size: 8, color: '#64748b' });
      text(formatAmount(debt.totalSaleAmount, currency), debtColumns[1], y + 25, { size: 9, color: '#334155' });
      text(formatAmount((debt.initialPayment || 0) + (debt.amountRepaid || 0), currency), debtColumns[2], y + 25, { size: 9, color: '#047857' });
      text(formatAmount(debt.remainingBalance, currency), debtColumns[3], y + 25, { size: 9, color: '#be123c' });
      const status = debt.status === 'CANCELLED' || debt.notes?.includes('[CANCELLED:')
        ? 'La kansalay'
        : debt.status === 'PAID' ? 'La bixiyay' : 'Furan';
      text(status, debtColumns[4], y + 25, { size: 8, color: '#334155', maxWidth: 62 });
      y += debtRowHeight;
    });
  } else {
    text('Ma jiro diiwaan dayn ah.', margin + 10, y + 25, { size: 11, color: '#64748b' });
    y += debtRowHeight;
  }

  y += 24;
  text('LACAG-BIXINNADII U DAMBEEYAY', margin, y, { size: 13, color: '#142746', weight: 700 });
  y += 15;
  roundedRect(margin, y, contentWidth, 34, 6, '#142746');
  text('Taariikh', margin + 10, y + 22, { size: 9, color: '#ffffff', weight: 700 });
  text('Rasiid', margin + 135, y + 22, { size: 9, color: '#ffffff', weight: 700 });
  text('Habka lacag-bixinta', margin + 275, y + 22, { size: 9, color: '#ffffff', weight: 700 });
  text('Lacagta', width - margin - 10, y + 22, { size: 9, color: '#ffffff', weight: 700, align: 'right' });
  y += 34;

  if (recentPayments.length) {
    recentPayments.forEach((payment, index) => {
      if (index % 2 === 0) roundedRect(margin, y, contentWidth, paymentRowHeight, 4, '#f8fafc');
      const method = payment.paymentMethod === 'MOBILE_MONEY' ? 'Lacagta telefoonka'
        : payment.paymentMethod === 'BANK_TRANSFER' ? 'Bangiga'
          : payment.paymentMethod === 'CASH' ? 'Caddaan' : 'Hab kale';
      text(payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('so-SO') : '-', margin + 10, y + 24, { size: 9, color: '#334155' });
      text(payment.receiptNumber || payment.paymentNumber || '-', margin + 135, y + 24, { size: 9, color: '#334155' });
      text(method, margin + 275, y + 24, { size: 9, color: '#334155' });
      text(formatAmount(payment.amount, currency), width - margin - 10, y + 24, { size: 9, color: '#047857', weight: 700, align: 'right' });
      y += paymentRowHeight;
    });
  } else {
    text('Ma jiro lacag-bixin hore.', margin + 10, y + 24, { size: 10, color: '#64748b' });
    y += paymentRowHeight;
  }

  separator(height - 68);
  text('Waad ku mahadsan tahay iibsigaaga, macmiil.', width / 2, height - 82, {
    size: 10,
    color: '#64748b',
    align: 'center',
  });
  if (logo.complete && logo.naturalWidth > 0) {
    context.drawImage(logo, width / 2 - 146, height - 62, 50, 26);
  }
  text('Maraayn Management Business', width / 2 - 86, height - 42, {
    size: 10,
    color: '#142746',
    weight: 700,
    maxWidth: 220,
  });
  text('Developer By Anas Abdiwahid', width / 2, height - 27, {
    size: 8,
    color: '#94a3b8',
    align: 'center',
  });

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => result ? resolve(result) : reject(new Error('PNG image could not be created')), 'image/png');
  });
  return new File([blob], `Rasiid-Xisaab-${customer.code || customer._id}.png`, { type: 'image/png' });
}
