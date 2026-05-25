-- CreateTable
CREATE TABLE "App" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "public_url" TEXT DEFAULT '',
    "api_key" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "TMDB" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "lastRequestAt" DATETIME,
    "requestesCount" INTEGER NOT NULL DEFAULT 0
);

-- CreateIndex
CREATE UNIQUE INDEX "App_name_key" ON "App"("name");

-- CreateIndex
CREATE UNIQUE INDEX "App_url_key" ON "App"("url");

-- CreateIndex
CREATE UNIQUE INDEX "App_api_key_key" ON "App"("api_key");
