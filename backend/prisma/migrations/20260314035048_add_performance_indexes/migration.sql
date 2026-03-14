-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- CreateIndex
CREATE INDEX "Order_customerState_idx" ON "Order"("customerState");

-- CreateIndex
CREATE INDEX "Stock_operatorId_idx" ON "Stock"("operatorId");
