-- Endereço completo de entrega no pedido (antes só CEP, cidade e UF eram gravados).
ALTER TABLE "Order" ADD COLUMN "shippingRecipient" TEXT;
ALTER TABLE "Order" ADD COLUMN "shippingStreet" TEXT;
ALTER TABLE "Order" ADD COLUMN "shippingNumber" TEXT;
ALTER TABLE "Order" ADD COLUMN "shippingComplement" TEXT;
ALTER TABLE "Order" ADD COLUMN "shippingDistrict" TEXT;
