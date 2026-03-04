/**
 * HTML and plain-text email templates matching MUI theme (Playfair Display, Work Sans, #D4A99A, #FAF7F5, #2D2D2D, #E8E0DC).
 */

const VERIFICATION_SUBJECT = 'Потвърдете своя имейл за LoveReWorn';

export function getVerificationSubject(): string {
  return VERIFICATION_SUBJECT;
}

export function getVerificationHtml(params: { name: string; code: string }): string {
  const { name, code } = params;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${VERIFICATION_SUBJECT}</title>
</head>
<body style="margin:0; padding:0; background-color:#FAF7F5; font-family:'Work Sans',sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#FAF7F5; padding:24px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:480px; border-radius:16px; border:1px solid #E8E0DC; background:#fff;">
          <tr>
            <td style="padding:32px 24px;">
              <h1 style="margin:0 0 16px; font-family:'Playfair Display',serif; font-size:24px; font-weight:600; color:#D4A99A;">
                Потвърдете своя имейл
              </h1>
              <p style="margin:0 0 24px; font-size:16px; line-height:1.5; color:#2D2D2D;">
                Здравейте${name ? `, ${name}` : ''}!
              </p>
              <p style="margin:0 0 20px; font-size:16px; line-height:1.5; color:#2D2D2D;">
                Използвайте кода по-долу, за да потвърдите имейла си в LoveReWorn:
              </p>
              <div style="margin:24px 0; padding:16px 24px; border-radius:12px; background:linear-gradient(135deg,#D4A99A 0%,#C4918A 100%); text-align:center;">
                <span style="font-family:'Work Sans',sans-serif; font-size:28px; font-weight:600; letter-spacing:4px; color:#2D2D2D;">${code}</span>
              </div>
              <p style="margin:0; font-size:14px; line-height:1.5; color:#6B6B6B;">
                Кодът е валиден 15 минути. Ако не сте регистрирали акаунт, можете да игнорирате този имейл.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

export function getVerificationText(params: { name: string; code: string }): string {
  const { name, code } = params;
  return [
    'Потвърдете своя имейл за LoveReWorn',
    '',
    `Здравейте${name ? `, ${name}` : ''}!`,
    '',
    'Използвайте кода по-долу, за да потвърдите имейла си:',
    '',
    code,
    '',
    'Кодът е валиден 15 минути. Ако не сте регистрирали акаунт, можете да игнорирате този имейл.',
  ].join('\n');
}

// --- Password reset ---

const PASSWORD_RESET_SUBJECT = 'Нулиране на парола за LoveReWorn';

export function getPasswordResetSubject(): string {
  return PASSWORD_RESET_SUBJECT;
}

export function getPasswordResetHtml(params: { name: string; resetLink: string }): string {
  const { name, resetLink } = params;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${PASSWORD_RESET_SUBJECT}</title>
</head>
<body style="margin:0; padding:0; background-color:#FAF7F5; font-family:'Work Sans',sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#FAF7F5; padding:24px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:480px; border-radius:16px; border:1px solid #E8E0DC; background:#fff;">
          <tr>
            <td style="padding:32px 24px;">
              <h1 style="margin:0 0 16px; font-family:'Playfair Display',serif; font-size:24px; font-weight:600; color:#D4A99A;">
                Нулиране на парола
              </h1>
              <p style="margin:0 0 24px; font-size:16px; line-height:1.5; color:#2D2D2D;">
                Здравейте${name ? `, ${name}` : ''}!
              </p>
              <p style="margin:0 0 20px; font-size:16px; line-height:1.5; color:#2D2D2D;">
                Получихме заявка за нулиране на паролата ви. Натиснете бутона по-долу, за да зададете нова парола:
              </p>
              <p style="margin:24px 0;">
                <a href="${resetLink}" style="display:inline-block; padding:14px 28px; border-radius:12px; background:linear-gradient(135deg,#D4A99A 0%,#C4918A 100%); color:#2D2D2D; font-size:16px; font-weight:600; text-decoration:none;">Нулиране на парола</a>
              </p>
              <p style="margin:0; font-size:14px; line-height:1.5; color:#6B6B6B;">
                Връзката е валидна 1 час. Ако не сте поискали нулиране на парола, можете да игнорирате този имейл.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

export function getPasswordResetText(params: { name: string; resetLink: string }): string {
  const { name, resetLink } = params;
  return [
    'Нулиране на парола за LoveReWorn',
    '',
    `Здравейте${name ? `, ${name}` : ''}!`,
    '',
    'Получихме заявка за нулиране на паролата ви. Отворете следната връзка, за да зададете нова парола:',
    '',
    resetLink,
    '',
    'Връзката е валидна 1 час. Ако не сте поискали нулиране на парола, можете да игнорирате този имейл.',
  ].join('\n');
}

// --- New message (contact) notification ---

const NEW_MESSAGE_SUBJECT = 'Ново съобщение в LoveReWorn';

export function getNewMessageSubject(): string {
  return NEW_MESSAGE_SUBJECT;
}

export function getNewMessageHtml(params: {
  recipientName: string;
  senderName: string;
  listingTitle?: string | null;
  messagesUrl: string;
}): string {
  const { recipientName, senderName, listingTitle, messagesUrl } = params;
  const context = listingTitle
    ? `относно обява „${listingTitle}"`
    : 'в LoveReWorn';
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${NEW_MESSAGE_SUBJECT}</title>
</head>
<body style="margin:0; padding:0; background-color:#FAF7F5; font-family:'Work Sans',sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#FAF7F5; padding:24px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:480px; border-radius:16px; border:1px solid #E8E0DC; background:#fff;">
          <tr>
            <td style="padding:32px 24px;">
              <h1 style="margin:0 0 16px; font-family:'Playfair Display',serif; font-size:24px; font-weight:600; color:#D4A99A;">
                Ново съобщение
              </h1>
              <p style="margin:0 0 24px; font-size:16px; line-height:1.5; color:#2D2D2D;">
                Здравейте${recipientName ? `, ${recipientName}` : ''}!
              </p>
              <p style="margin:0 0 20px; font-size:16px; line-height:1.5; color:#2D2D2D;">
                <strong>${senderName}</strong> ви изпрати съобщение ${context}.
              </p>
              <p style="margin:24px 0;">
                <a href="${messagesUrl}" style="display:inline-block; padding:14px 28px; border-radius:12px; background:linear-gradient(135deg,#D4A99A 0%,#C4918A 100%); color:#2D2D2D; font-size:16px; font-weight:600; text-decoration:none;">Отворете съобщенията</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

export function getNewMessageText(params: {
  recipientName: string;
  senderName: string;
  listingTitle?: string | null;
  messagesUrl: string;
}): string {
  const { recipientName, senderName, listingTitle, messagesUrl } = params;
  const context = listingTitle
    ? `относно обява „${listingTitle}"`
    : 'в LoveReWorn';
  return [
    NEW_MESSAGE_SUBJECT,
    '',
    recipientName ? `Здравейте, ${recipientName}!` : 'Здравейте!',
    '',
    `${senderName} ви изпрати съобщение ${context}.`,
    '',
    'Отворете съобщенията тук:',
    messagesUrl,
  ].join('\n');
}

// --- Order confirmation (protected checkout) ---

const ORDER_CONFIRMATION_SUBJECT = 'Успешна защитена поръчка в LoveReWorn';

export function getOrderConfirmationSubject(): string {
  return ORDER_CONFIRMATION_SUBJECT;
}

export function getOrderConfirmationHtml(params: {
  name: string;
  orderUrl: string;
  listingTitle: string;
  totalPrice: string;
}): string {
  const { name, orderUrl, listingTitle, totalPrice } = params;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${ORDER_CONFIRMATION_SUBJECT}</title>
</head>
<body style="margin:0; padding:0; background-color:#FAF7F5; font-family:'Work Sans',sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#FAF7F5; padding:24px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:520px; border-radius:16px; border:1px solid #E8E0DC; background:#fff;">
          <tr>
            <td style="padding:32px 24px;">
              <h1 style="margin:0 0 12px; font-family:'Playfair Display',serif; font-size:24px; font-weight:600; color:#D4A99A;">
                Благодарим за вашата поръчка
              </h1>
              <p style="margin:0 0 16px; font-size:16px; line-height:1.5; color:#2D2D2D;">
                Здравейте${name ? `, ${name}` : ''}! Вашата защитена покупка беше създадена успешно.
              </p>
              <div style="margin:20px 0; padding:14px 18px; border-radius:12px; background-color:#FAF7F5; border:1px solid #E8E0DC;">
                <p style="margin:0 0 6px; font-size:15px; color:#6B6B6B;">Артикул</p>
                <p style="margin:0 0 6px; font-size:16px; font-weight:600; color:#2D2D2D;">${listingTitle}</p>
                <p style="margin:4px 0 0; font-size:16px; font-weight:600; color:#D4897E;">Обща сума: ${totalPrice}</p>
              </div>
              <p style="margin:0 0 16px; font-size:15px; line-height:1.6; color:#2D2D2D;">
                Вашето плащане е <strong>задържано сигурно</strong> от LoveReWorn, докато не потвърдите, че сте получили роклята.
              </p>
              <p style="margin:0 0 10px; font-size:15px; line-height:1.6; color:#2D2D2D;">
                Какво следва:
              </p>
              <ol style="margin:0 0 18px 20px; padding:0; font-size:15px; line-height:1.7; color:#2D2D2D;">
                <li><strong>Потвърждение на плащането:</strong> Банката ви потвърждава плащането и средствата се задържат при нас.</li>
                <li><strong>Продавачът изпраща роклята:</strong> Продавачът подготвя пратката и добавя данни за куриер и проследяване по поръчката.</li>
                <li><strong>Вие получавате пратката:</strong> Пробвате роклята и се уверявате, че отговаря на описанието.</li>
                <li><strong>Потвърждавате получаването:</strong> От страницата на поръчката натискате „Потвърди получаването“.</li>
                <li><strong>Средствата се изплащат на продавача:</strong> След вашето потвърждение изплащаме сумата към продавача.</li>
              </ol>
              <p style="margin:0 0 18px; font-size:14px; line-height:1.6; color:#6B6B6B;">
                Ако нещо не е наред с поръчката (забавяне, несъответствие, повреда), можете да отворите спор от същата страница преди да потвърдите получаването.
              </p>
              <p style="margin:22px 0 0; text-align:center;">
                <a href="${orderUrl}" style="display:inline-block; padding:14px 28px; border-radius:12px; background:linear-gradient(135deg,#D4A99A 0%,#C4918A 100%); color:#2D2D2D; font-size:16px; font-weight:600; text-decoration:none;">
                  Виж поръчката
                </a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

export function getOrderConfirmationText(params: {
  name: string;
  orderUrl: string;
  listingTitle: string;
  totalPrice: string;
}): string {
  const { name, orderUrl, listingTitle, totalPrice } = params;
  return [
    ORDER_CONFIRMATION_SUBJECT,
    '',
    name ? `Здравейте, ${name}!` : 'Здравейте!',
    '',
    'Вашата защитена покупка беше създадена успешно.',
    '',
    `Артикул: ${listingTitle}`,
    `Обща сума: ${totalPrice}`,
    '',
    'Как протича процесът:',
    '1. Потвърждение на плащането – средствата се задържат сигурно при нас.',
    '2. Продавачът изпраща роклята и добавя данни за проследяване.',
    '3. Вие получавате пратката и проверявате дали всичко е наред.',
    '4. Потвърждавате получаването от страницата на поръчката.',
    '5. След вашето потвърждение изплащаме сумата към продавача.',
    '',
    'Ако има проблем с поръчката, можете да отворите спор преди да потвърдите получаването.',
    '',
    'Вижте поръчката тук:',
    orderUrl,
  ].join('\n');
}

// --- New order notification for seller ---

const SELLER_NEW_ORDER_SUBJECT = 'Нова защитена поръчка за вашата рокля в LoveReWorn';

export function getSellerNewOrderSubject(): string {
  return SELLER_NEW_ORDER_SUBJECT;
}

export function getSellerNewOrderHtml(params: {
  sellerName: string;
  orderUrl: string;
  listingTitle: string;
  totalPrice: string;
  buyerName?: string | null;
}): string {
  const { sellerName, orderUrl, listingTitle, totalPrice, buyerName } = params;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${SELLER_NEW_ORDER_SUBJECT}</title>
</head>
<body style="margin:0; padding:0; background-color:#FAF7F5; font-family:'Work Sans',sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#FAF7F5; padding:24px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:520px; border-radius:16px; border:1px solid #E8E0DC; background:#fff;">
          <tr>
            <td style="padding:32px 24px;">
              <h1 style="margin:0 0 12px; font-family:'Playfair Display',serif; font-size:24px; font-weight:600; color:#D4A99A;">
                Получихте нова поръчка
              </h1>
              <p style="margin:0 0 16px; font-size:16px; line-height:1.5; color:#2D2D2D;">
                Здравейте${sellerName ? `, ${sellerName}` : ''}! Имате нова <strong>защитена поръчка</strong> за вашата рокля.
              </p>
              <div style="margin:20px 0; padding:14px 18px; border-radius:12px; background-color:#FAF7F5; border:1px solid #E8E0DC;">
                <p style="margin:0 0 6px; font-size:15px; color:#6B6B6B;">Артикул</p>
                <p style="margin:0 0 6px; font-size:16px; font-weight:600; color:#2D2D2D;">${listingTitle}</p>
                <p style="margin:4px 0 0; font-size:16px; font-weight:600; color:#D4897E;">Обща сума: ${totalPrice}</p>
                ${
                  buyerName
                    ? `<p style="margin:8px 0 0; font-size:14px; color:#6B6B6B;">Купувач: ${buyerName}</p>`
                    : ''
                }
              </div>
              <p style="margin:0 0 16px; font-size:15px; line-height:1.6; color:#2D2D2D;">
                Плащането е задържано сигурно при LoveReWorn. След като изпратите роклята и купувачът потвърди получаването, сумата ще бъде изплатена към вас.
              </p>
              <p style="margin:0 0 18px; font-size:14px; line-height:1.6; color:#6B6B6B;">
                Отворете страницата на поръчката, за да видите адрес за доставка и да добавите куриер и номер за проследяване.
              </p>
              <p style="margin:22px 0 0; text-align:center;">
                <a href="${orderUrl}" style="display:inline-block; padding:14px 28px; border-radius:12px; background:linear-gradient(135deg,#D4A99A 0%,#C4918A 100%); color:#2D2D2D; font-size:16px; font-weight:600; text-decoration:none;">
                  Отвори поръчката
                </a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

export function getSellerNewOrderText(params: {
  sellerName: string;
  orderUrl: string;
  listingTitle: string;
  totalPrice: string;
  buyerName?: string | null;
}): string {
  const { sellerName, orderUrl, listingTitle, totalPrice, buyerName } = params;
  return [
    SELLER_NEW_ORDER_SUBJECT,
    '',
    sellerName ? `Здравейте, ${sellerName}!` : 'Здравейте!',
    '',
    'Имате нова защитена поръчка за ваша рокля.',
    '',
    `Артикул: ${listingTitle}`,
    `Обща сума: ${totalPrice}`,
    buyerName ? `Купувач: ${buyerName}` : '',
    '',
    'Плащането е задържано сигурно при LoveReWorn. След като изпратите роклята и купувачът потвърди получаването, сумата ще бъде изплатена към вас.',
    '',
    'Отворете поръчката тук:',
    orderUrl,
  ]
    .filter(Boolean)
    .join('\n');
}

