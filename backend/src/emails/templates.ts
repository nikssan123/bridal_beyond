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
                Плащането е задържано сигурно при LoveReWorn. След като изпратите роклята и купувачът потвърди получаването, сумата ще бъде изплатена към вас. След това преводът към вашата банкова сметка обичайно се извършва в рамките на около 7 дни според графика за изплащания на Stripe.
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
    'Плащането е задържано сигурно при LoveReWorn. След като изпратите роклята и купувачът потвърди получаването, сумата ще бъде изплатена към вас. След това преводът към вашата банкова сметка обичайно се извършва в рамките на около 7 дни според графика за изплащания на Stripe.',
    '',
    'Отворете поръчката тук:',
    orderUrl,
  ]
    .filter(Boolean)
    .join('\n');
}

// --- Seller needs to confirm order (authorization pending) ---

const SELLER_CONFIRM_ORDER_SUBJECT =
  'Нова заявка за покупка – потвърдете или отменете поръчката в LoveReWorn';

export function getSellerConfirmOrderSubject(): string {
  return SELLER_CONFIRM_ORDER_SUBJECT;
}

export function getSellerConfirmOrderHtml(params: {
  sellerName: string;
  orderUrl: string;
  listingTitle: string;
  totalPrice: string;
  deadlineHours?: number;
  buyerName?: string | null;
}): string {
  const { sellerName, orderUrl, listingTitle, totalPrice, deadlineHours = 24, buyerName } = params;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${SELLER_CONFIRM_ORDER_SUBJECT}</title>
</head>
<body style="margin:0; padding:0; background-color:#FAF7F5; font-family:'Work Sans',sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#FAF7F5; padding:24px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:520px; border-radius:16px; border:1px solid #E8E0DC; background:#fff;">
          <tr>
            <td style="padding:32px 24px;">
              <h1 style="margin:0 0 12px; font-family:'Playfair Display',serif; font-size:24px; font-weight:600; color:#D4A99A;">
                Нова заявка за покупка
              </h1>
              <p style="margin:0 0 16px; font-size:16px; line-height:1.5; color:#2D2D2D;">
                Здравейте${sellerName ? `, ${sellerName}` : ''}! Купувач е направил заявка за <strong>защитена покупка</strong> на ваша рокля.
              </p>
              <div style="margin:20px 0; padding:14px 18px; border-radius:12px; background-color:#FAF7F5; border:1px solid #E8E0DC;">
                <p style="margin:0 0 6px; font-size:15px; color:#6B6B6B;">Артикул</p>
                <p style="margin:0 0 6px; font-size:16px; font-weight:600; color:#2D2D2D;">${listingTitle}</p>
                <p style="margin:4px 0 0; font-size:16px; font-weight:600; color:#D4897E;">Обща сума за купувача: ${totalPrice}</p>
                ${
                  buyerName
                    ? `<p style="margin:8px 0 0; font-size:14px; color:#6B6B6B;">Купувач: ${buyerName}</p>`
                    : ''
                }
              </div>
              <p style="margin:0 0 12px; font-size:15px; line-height:1.6; color:#2D2D2D;">
                Картата на купувача е <strong>авторизирана</strong>, но сумата все още не е събрана. 
              </p>
              <p style="margin:0 0 12px; font-size:15px; line-height:1.6; color:#2D2D2D;">
                В рамките на около <strong>${deadlineHours} часа</strong> трябва да влезете в профила си и да:
              </p>
              <ol style="margin:0 0 18px 20px; padding:0; font-size:15px; line-height:1.7; color:#2D2D2D;">
                <li><strong>Потвърдите поръчката</strong>, ако роклята е налична – тогава плащането ще бъде събрано и ще можете да изпратите пратката.</li>
                <li><strong>Откажете поръчката</strong>, ако роклята вече не е налична – тогава авторизацията ще бъде отменена и купувачът няма да бъде таксуван.</li>
              </ol>
              <p style="margin:0 0 18px; font-size:14px; line-height:1.6; color:#6B6B6B;">
                Ако не предприемете действие навреме, заявката може да бъде отменена автоматично и купувачът няма да бъде таксуван.
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

export function getSellerConfirmOrderText(params: {
  sellerName: string;
  orderUrl: string;
  listingTitle: string;
  totalPrice: string;
  deadlineHours?: number;
  buyerName?: string | null;
}): string {
  const { sellerName, orderUrl, listingTitle, totalPrice, deadlineHours = 24, buyerName } = params;
  return [
    SELLER_CONFIRM_ORDER_SUBJECT,
    '',
    sellerName ? `Здравейте, ${sellerName}!` : 'Здравейте!',
    '',
    'Купувач е направил заявка за защитена покупка на ваша рокля.',
    '',
    `Артикул: ${listingTitle}`,
    `Обща сума за купувача: ${totalPrice}`,
    buyerName ? `Купувач: ${buyerName}` : '',
    '',
    'Картата на купувача е авторизирана, но плащането все още не е събрано.',
    `В рамките на около ${deadlineHours} часа трябва да потвърдите поръчката, ако роклята е налична, или да я откажете, ако не е.`,
    '',
    '1. Потвърдете поръчката, ако роклята е налична – тогава плащането ще бъде събрано и ще можете да изпратите пратката.',
    '2. Откажете поръчката, ако роклята вече не е налична – тогава авторизацията ще бъде отменена и купувачът няма да бъде таксуван.',
    '',
    'Отворете поръчката тук:',
    orderUrl,
  ]
    .filter(Boolean)
    .join('\n');
}

// --- Order cancelled notification for buyer ---

const BUYER_ORDER_CANCELLED_SUBJECT = 'Вашата поръчка беше отменена – LoveReWorn';

export function getBuyerOrderCancelledSubject(): string {
  return BUYER_ORDER_CANCELLED_SUBJECT;
}

export function getBuyerOrderCancelledHtml(params: {
  name: string;
  orderUrl: string;
  listingTitle: string;
}): string {
  const { name, orderUrl, listingTitle } = params;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${BUYER_ORDER_CANCELLED_SUBJECT}</title>
</head>
<body style="margin:0; padding:0; background-color:#FAF7F5; font-family:'Work Sans',sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#FAF7F5; padding:24px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:520px; border-radius:16px; border:1px solid #E8E0DC; background:#fff;">
          <tr>
            <td style="padding:32px 24px;">
              <h1 style="margin:0 0 12px; font-family:'Playfair Display',serif; font-size:24px; font-weight:600; color:#D4A99A;">
                Поръчката ви беше отменена
              </h1>
              <p style="margin:0 0 16px; font-size:16px; line-height:1.5; color:#2D2D2D;">
                Здравейте${name ? `, ${name}` : ''}! Поръчката ви за роклята <strong>${listingTitle}</strong> беше отменена.
              </p>
              <p style="margin:0 0 16px; font-size:15px; line-height:1.6; color:#2D2D2D;">
                Плащането ви <strong>няма да бъде таксувано</strong>. Ако банката ви е задържала сумата като временна авторизация, тя ще бъде освободена автоматично след кратък период.
              </p>
              <p style="margin:0 0 18px; font-size:14px; line-height:1.6; color:#6B6B6B;">
                Можете да разгледате други рокли в LoveReWorn и да направите нова защитена поръчка по всяко време.
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

export function getBuyerOrderCancelledText(params: {
  name: string;
  orderUrl: string;
  listingTitle: string;
}): string {
  const { name, orderUrl, listingTitle } = params;
  return [
    BUYER_ORDER_CANCELLED_SUBJECT,
    '',
    name ? `Здравейте, ${name}!` : 'Здравейте!',
    '',
    `Поръчката ви за роклята "${listingTitle}" беше отменена.`,
    '',
    'Плащането ви няма да бъде таксувано. Ако банката ви е задържала сумата като временна авторизация, тя ще бъде освободена автоматично след кратък период.',
    '',
    'Можете да разгледате други рокли и да направите нова защитена поръчка по всяко време.',
    '',
    'Вижте подробности за поръчката тук (по избор):',
    orderUrl,
  ].join('\n');
}

// --- Order shipped notification for buyer ---

const BUYER_ORDER_SHIPPED_SUBJECT = 'Вашата поръчка е изпратена – LoveReWorn';

export function getBuyerOrderShippedSubject(): string {
  return BUYER_ORDER_SHIPPED_SUBJECT;
}

export function getBuyerOrderShippedHtml(params: {
  name: string;
  orderUrl: string;
  listingTitle: string;
  courier: string;
  trackingNumber: string;
}): string {
  const { name, orderUrl, listingTitle, courier, trackingNumber } = params;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${BUYER_ORDER_SHIPPED_SUBJECT}</title>
</head>
<body style="margin:0; padding:0; background-color:#FAF7F5; font-family:'Work Sans',sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#FAF7F5; padding:24px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:520px; border-radius:16px; border:1px solid #E8E0DC; background:#fff;">
          <tr>
            <td style="padding:32px 24px;">
              <h1 style="margin:0 0 12px; font-family:'Playfair Display',serif; font-size:24px; font-weight:600; color:#D4A99A;">
                Вашата поръчка е изпратена
              </h1>
              <p style="margin:0 0 16px; font-size:16px; line-height:1.5; color:#2D2D2D;">
                Здравейте${name ? `, ${name}` : ''}! Продавачът изпрати вашата рокля.
              </p>
              <div style="margin:20px 0; padding:14px 18px; border-radius:12px; background-color:#FAF7F5; border:1px solid #E8E0DC;">
                <p style="margin:0 0 6px; font-size:15px; color:#6B6B6B;">Артикул</p>
                <p style="margin:0 0 8px; font-size:16px; font-weight:600; color:#2D2D2D;">${listingTitle}</p>
                <p style="margin:0 0 4px; font-size:14px; color:#2D2D2D;"><strong>Куриер:</strong> ${courier}</p>
                <p style="margin:0; font-size:14px; color:#2D2D2D;"><strong>Номер за проследяване:</strong> ${trackingNumber}</p>
              </div>
              <p style="margin:0 0 18px; font-size:15px; line-height:1.6; color:#2D2D2D;">
                След получаване проверете роклята и от страницата на поръчката натиснете „Потвърди получаването“, за да освободим плащането към продавача.
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

export function getBuyerOrderShippedText(params: {
  name: string;
  orderUrl: string;
  listingTitle: string;
  courier: string;
  trackingNumber: string;
}): string {
  const { name, orderUrl, listingTitle, courier, trackingNumber } = params;
  return [
    BUYER_ORDER_SHIPPED_SUBJECT,
    '',
    name ? `Здравейте, ${name}!` : 'Здравейте!',
    '',
    'Продавачът изпрати вашата рокля.',
    '',
    `Артикул: ${listingTitle}`,
    `Куриер: ${courier}`,
    `Номер за проследяване: ${trackingNumber}`,
    '',
    'След получаване проверете роклята и от страницата на поръчката потвърдете получаването.',
    '',
    'Вижте поръчката тук:',
    orderUrl,
  ].join('\n');
}

// --- Seller: buyer confirmed receipt ---

const SELLER_ORDER_COMPLETED_SUBJECT =
  'Купувачът потвърди получаването – очаквайте изплащане по IBAN в рамките на 7 дни';

export function getSellerOrderCompletedSubject(): string {
  return SELLER_ORDER_COMPLETED_SUBJECT;
}

export function getSellerOrderCompletedHtml(params: {
  sellerName: string;
  orderUrl: string;
  listingTitle: string;
  totalPrice: string;
}): string {
  const { sellerName, orderUrl, listingTitle, totalPrice } = params;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${SELLER_ORDER_COMPLETED_SUBJECT}</title>
</head>
<body style="margin:0; padding:0; background-color:#FAF7F5; font-family:'Work Sans',sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#FAF7F5; padding:24px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:520px; border-radius:16px; border:1px solid #E8E0DC; background:#fff;">
          <tr>
            <td style="padding:32px 24px;">
              <h1 style="margin:0 0 12px; font-family:'Playfair Display',serif; font-size:24px; font-weight:600; color:#D4A99A;">
                Купувачът потвърди получаването
              </h1>
              <p style="margin:0 0 16px; font-size:16px; line-height:1.5; color:#2D2D2D;">
                Здравейте${sellerName ? `, ${sellerName}` : ''}! Купувачът потвърди, че е получил роклята и поръчката е завършена успешно.
              </p>
              <div style="margin:20px 0; padding:14px 18px; border-radius:12px; background-color:#FAF7F5; border:1px solid #E8E0DC;">
                <p style="margin:0 0 6px; font-size:15px; color:#6B6B6B;">Артикул</p>
                <p style="margin:0 0 6px; font-size:16px; font-weight:600; color:#2D2D2D;">${listingTitle}</p>
                <p style="margin:4px 0 0; font-size:16px; font-weight:600; color:#D4897E;">Сума за изплащане: ${totalPrice}</p>
              </div>
              <p style="margin:0 0 16px; font-size:15px; line-height:1.6; color:#2D2D2D;">
                Средствата по тази поръчка са освободени. Вашето изплащане ще бъде изпратено по посочения от вас IBAN чрез Stripe. 
                Обичайно преводът към банковата сметка отнема до около <strong>7 дни</strong>, в зависимост от графика за изплащания на банката и Stripe.
              </p>
              <p style="margin:0 0 18px; font-size:14px; line-height:1.6; color:#6B6B6B;">
                Можете да следите статуса на поръчката и да виждате детайли за плащането от вашето табло в LoveReWorn.
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

export function getSellerOrderCompletedText(params: {
  sellerName: string;
  orderUrl: string;
  listingTitle: string;
  totalPrice: string;
}): string {
  const { sellerName, orderUrl, listingTitle, totalPrice } = params;
  return [
    SELLER_ORDER_COMPLETED_SUBJECT,
    '',
    sellerName ? `Здравейте, ${sellerName}!` : 'Здравейте!',
    '',
    'Купувачът потвърди, че е получил роклята и поръчката е завършена успешно.',
    '',
    `Артикул: ${listingTitle}`,
    `Сума за изплащане: ${totalPrice}`,
    '',
    'Средствата по тази поръчка са освободени. Изплащането ще бъде изпратено по посочения от вас IBAN чрез Stripe и обичайно отнема до около 7 дни, в зависимост от банката и графика за изплащания.',
    '',
    'Вижте поръчката тук:',
    orderUrl,
  ].join('\n');
}

// --- Listing created without payment method (reminder to connect) ---

const LISTING_CREATED_NO_PAYMENT_SUBJECT = 'Обявата ви е активна – настройте плащане, за да получавате пари';

export function getListingCreatedNoPaymentSubject(): string {
  return LISTING_CREATED_NO_PAYMENT_SUBJECT;
}

export function getListingCreatedNoPaymentHtml(params: {
  sellerName: string;
  listingTitle: string;
  profileUrl: string;
}): string {
  const { sellerName, listingTitle, profileUrl } = params;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${LISTING_CREATED_NO_PAYMENT_SUBJECT}</title>
</head>
<body style="margin:0; padding:0; background-color:#FAF7F5; font-family:'Work Sans',sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#FAF7F5; padding:24px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:520px; border-radius:16px; border:1px solid #E8E0DC; background:#fff;">
          <tr>
            <td style="padding:32px 24px;">
              <h1 style="margin:0 0 12px; font-family:'Playfair Display',serif; font-size:24px; font-weight:600; color:#D4A99A;">
                Обявата ви е активна
              </h1>
              <p style="margin:0 0 16px; font-size:16px; line-height:1.5; color:#2D2D2D;">
                Здравейте${sellerName ? `, ${sellerName}` : ''}! Обявата ви <strong>${listingTitle}</strong> е публикувана и е видима за купувачите.
              </p>
              <p style="margin:0 0 16px; font-size:16px; line-height:1.5; color:#2D2D2D;">
                <strong>Важно:</strong> Няма да можете да получавате плащания или да завършите продажба, докато не свържете начин на плащане в профила си. Купувачите виждат обявата, но плащането с защита е блокирано, докато не завършите настройката за изплащания.
              </p>
              <p style="margin:0 0 20px; font-size:15px; line-height:1.6; color:#6B6B6B;">
                За да получавате пари, когато някой купи артикула ви, отидете в профила си и завършете еднократната настройка на плащането. Процесът е сигурен и отнема само няколко минути. Дотогава препоръчваме да пишете на заинтересованите купувачи и да ги информирате, че настройвате плащанията.
              </p>
              <p style="margin:22px 0 0; text-align:center;">
                <a href="${profileUrl}" style="display:inline-block; padding:14px 28px; border-radius:12px; background:linear-gradient(135deg,#D4A99A 0%,#C4918A 100%); color:#2D2D2D; font-size:16px; font-weight:600; text-decoration:none;">
                  Отвори профил и настрой плащане
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

export function getListingCreatedNoPaymentText(params: {
  sellerName: string;
  listingTitle: string;
  profileUrl: string;
}): string {
  const { sellerName, listingTitle, profileUrl } = params;
  return [
    LISTING_CREATED_NO_PAYMENT_SUBJECT,
    '',
    sellerName ? `Здравейте, ${sellerName}!` : 'Здравейте!',
    '',
    `Обявата ви "${listingTitle}" е публикувана и е видима за купувачите.`,
    '',
    'Важно: Няма да можете да получавате плащания или да завършите продажба, докато не свържете начин на плащане в профила си. Купувачите виждат обявата, но плащането с защита е блокирано до завършване на настройката.',
    '',
    'За да получавате пари при покупка, отидете в профила си и завършете еднократната настройка на плащането. Процесът е сигурен и отнема само няколко минути.',
    '',
    'Отворете профила си тук:',
    profileUrl,
  ].join('\n');
}

// --- Seller: someone tried to buy but you have no payment (urgent) ---

const SELLER_BUYER_WANTS_TO_BUY_SUBJECT = 'Някой иска да купи от обявата ви – завършете настройката за плащане сега';

export function getSellerBuyerWantsToBuySubject(): string {
  return SELLER_BUYER_WANTS_TO_BUY_SUBJECT;
}

export function getSellerBuyerWantsToBuyHtml(params: {
  sellerName: string;
  listingTitle: string;
  profileUrl: string;
  buyerName?: string | null;
}): string {
  const { sellerName, listingTitle, profileUrl, buyerName } = params;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${SELLER_BUYER_WANTS_TO_BUY_SUBJECT}</title>
</head>
<body style="margin:0; padding:0; background-color:#FAF7F5; font-family:'Work Sans',sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#FAF7F5; padding:24px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:520px; border-radius:16px; border:1px solid #E8E0DC; background:#fff;">
          <tr>
            <td style="padding:32px 24px;">
              <h1 style="margin:0 0 12px; font-family:'Playfair Display',serif; font-size:24px; font-weight:600; color:#c0392b;">
                Купувач се опита да закупи от обявата ви
              </h1>
              <p style="margin:0 0 16px; font-size:16px; line-height:1.5; color:#2D2D2D;">
                Здравейте${sellerName ? `, ${sellerName}` : ''}! Някой се опита да купи обявата ви <strong>${listingTitle}</strong>, но не успя да завърши покупката, защото начинът ви за плащане все още не е свързан.
              </p>
              ${buyerName ? `<p style="margin:0 0 16px; font-size:15px; color:#6B6B6B;">Заинтересованият купувач е: <strong>${buyerName}</strong>. Помолихме го да ви изпрати лично съобщение в сайта. Отговорете му, след като завършите настройката за плащане, за да може да купи.</p>` : ''}
              <p style="margin:0 0 16px; font-size:16px; line-height:1.5; color:#2D2D2D;">
                <strong>Завършете настройката за плащане сега</strong>, за да получавате пари, когато купувачите закупуват от вас. Отидете в профила си и натиснете червения бутон <strong>Свържи начин на плащане</strong>, за да завършите еднократната настройка. Дотогава за вашите обяви не могат да се правят поръчки.
              </p>
              <p style="margin:22px 0 0; text-align:center;">
                <a href="${profileUrl}" style="display:inline-block; padding:14px 28px; border-radius:12px; background:#c0392b; color:#fff; font-size:16px; font-weight:600; text-decoration:none;">
                  Отвори профил и свържи плащане
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

export function getSellerBuyerWantsToBuyText(params: {
  sellerName: string;
  listingTitle: string;
  profileUrl: string;
  buyerName?: string | null;
}): string {
  const { sellerName, listingTitle, profileUrl, buyerName } = params;
  return [
    SELLER_BUYER_WANTS_TO_BUY_SUBJECT,
    '',
    sellerName ? `Здравейте, ${sellerName}!` : 'Здравейте!',
    '',
    `Някой се опита да купи обявата ви "${listingTitle}", но не успя да завърши покупката, защото начинът ви за плащане все още не е свързан.`,
    buyerName ? `Заинтересованият купувач е: ${buyerName}. Помолихме го да ви изпрати лично съобщение в сайта.` : '',
    '',
    'Завършете настройката за плащане сега: отидете в профила си и натиснете червения бутон "Свържи начин на плащане". Дотогава за вашите обяви не могат да се правят поръчки.',
    '',
    'Отворете профила си тук:',
    profileUrl,
  ]
    .filter(Boolean)
    .join('\n');
}

// --- Admin: custom message ---

export function getAdminCustomEmailHtml(params: { title: string; message: string }): string {
  const { title, message } = params;
  const htmlMessage = message.replace(/\n/g, '<br>');
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0; padding:0; background-color:#FAF7F5; font-family:'Work Sans',sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#FAF7F5; padding:24px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:480px; border-radius:16px; border:1px solid #E8E0DC; background:#fff;">
          <tr>
            <td style="padding:32px 24px;">
              <h1 style="margin:0 0 24px; font-family:'Playfair Display',serif; font-size:24px; font-weight:600; color:#D4A99A;">
                ${title}
              </h1>
              <p style="margin:0; font-size:16px; line-height:1.7; color:#2D2D2D;">
                ${htmlMessage}
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

export function getAdminCustomEmailText(params: { title: string; message: string }): string {
  return [params.title, '', params.message].join('\n');
}

