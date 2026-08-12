-- CreateIndex
CREATE INDEX "logs_appId_eventTime_id_idx" ON "logs"("appId", "eventTime", "id");

-- CreateIndex
CREATE INDEX "logs_severity_idx" ON "logs"("severity");

-- CreateIndex
CREATE INDEX "logs_attributes_idx" ON "logs" USING GIN ("attributes");
