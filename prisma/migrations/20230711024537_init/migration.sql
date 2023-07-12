-- CreateTable
CREATE TABLE "Destination" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "url" TEXT,
    "images" TEXT,
    "description" TEXT,
    "rating" TEXT,
    "latitude" TEXT,
    "longitude" TEXT
);

-- CreateTable
CREATE TABLE "_children" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_children_A_fkey" FOREIGN KEY ("A") REFERENCES "Destination" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_children_B_fkey" FOREIGN KEY ("B") REFERENCES "Destination" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "_children_AB_unique" ON "_children"("A", "B");

-- CreateIndex
CREATE INDEX "_children_B_index" ON "_children"("B");
