import { db } from "@/db";
import { categories } from "@/db/schema";

const categoryNames = [
  "Cars and vehicles",
  "Electronics",
  "Fashion",
  "Home and garden",
  "Jobs",
  "Pets",
  "Comedy",
  "Education",
  "Entertainment",
  "Film and animation",
  "Gaming",
  "How-to and style",
  "Music",
  "News and politics",
  "Non-profits and activism",
  "People and blogs",
  "Pets and animals",
  "Science and technology",
  "Sports",
  "Travel and events",
];

async function main() {
  console.log("Seeding categories...");

  try {
    const values = categoryNames.map((name) => ({
      name,
      description: `This is the ${name.toLowerCase()} category`,
    }));

    await db.insert(categories).values(values);

    console.log("Categories seeded successfully");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
