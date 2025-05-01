// prisma/seeds/07-marketplace.ts
import { PrismaClient, ListingType, ListingStatus } from "@prisma/client";

export async function seedMarketplace(prisma: PrismaClient) {
  console.log("Seeding marketplace...");

  // Get users for relationships
  const users = await prisma.user.findMany();

  if (users.length === 0) {
    console.warn("⚠️ No users found. Skipping marketplace seeding.");
    return;
  }

  const instructors = users.filter((u) => u.role === "INSTRUCTOR");
  const admin = users.find((u) => u.role === "ADMIN");

  // Create marketplace listings
  const listings = [
    {
      title: "Cours de perfectionnement en créneau",
      description:
        "Session d'une heure pour maîtriser le stationnement en créneau. Je vous montre les techniques les plus efficaces pour réussir à tous les coups.",
      price: 35.0,
      type: "SERVICE" as ListingType,
      status: "ACTIVE" as ListingStatus,
      imageUrls: ["/images/parking-lesson.jpg"],
      sellerId: instructors[0]?.id || admin?.id || users[0].id,
    },
    {
      title: "Kit L d'apprentissage complet",
      description:
        "Kit complet pour apprenti conducteur comprenant : 2 plaques L magnétiques, 1 rétroviseur supplémentaire, 1 guide des manœuvres essentielles.",
      price: 29.99,
      type: "PRODUCT" as ListingType,
      status: "ACTIVE" as ListingStatus,
      imageUrls: ["/images/l-plates-kit.jpg"],
      sellerId: admin?.id || users[0].id,
    },
    {
      title: "Formation écoconduite 3 heures",
      description:
        "Apprenez à réduire votre consommation et votre impact environnemental tout en conduisant. Formation de 3 heures incluant théorie et pratique.",
      price: 75.0,
      type: "COURSE" as ListingType,
      status: "ACTIVE" as ListingStatus,
      imageUrls: ["/images/eco-driving-course.jpg"],
      sellerId: instructors[0]?.id || admin?.id || users[0].id,
    },
    {
      title: "Rétroviseurs spécial angles morts",
      description:
        "Paire de rétroviseurs additionnels pour éliminer les angles morts. Installation facile, idéal pour les apprentis conducteurs.",
      price: 19.5,
      type: "PRODUCT" as ListingType,
      status: "ACTIVE" as ListingStatus,
      imageUrls: ["/images/blind-spot-mirrors.jpg"],
      sellerId: admin?.id || users[0].id,
    },
  ];

  const createdListings = [];
  for (const listing of listings) {
    const created = await prisma.marketplaceListing.create({
      data: listing,
    });
    createdListings.push(created);
  }

  console.log(`✅ Created ${createdListings.length} marketplace listings`);

  // Create some purchases
  const apprentices = users.filter((u) => u.role === "APPRENTICE");

  if (apprentices.length > 0 && createdListings.length > 0) {
    // Create 2-3 purchases
    const purchases = [
      {
        listingId: createdListings[1].id, // Kit L
        buyerId: apprentices[0].id,
        quantity: 1,
        totalPrice: createdListings[1].price,
        status: "COMPLETED",
        purchaseDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      },
      {
        listingId: createdListings[0].id, // Cours créneau
        buyerId: apprentices[1]?.id || apprentices[0].id,
        quantity: 1,
        totalPrice: createdListings[0].price,
        status: "COMPLETED",
        purchaseDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    ];

    for (const purchase of purchases) {
      await prisma.purchase.create({
        data: purchase,
      });
    }

    console.log(`✅ Created ${purchases.length} purchases`);
  }
}
