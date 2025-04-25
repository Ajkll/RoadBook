// prisma/seeds/05-community.ts
import { PrismaClient } from "@prisma/client";

export async function seedCommunity(prisma: PrismaClient) {
  console.log("Seeding community content...");

  // Get users for relationships
  const users = await prisma.user.findMany();

  if (users.length === 0) {
    console.warn("⚠️ No users found. Skipping community seeding.");
    return;
  }

  // Create posts
  const posts = [
    {
      title: "Mon premier jour de conduite",
      content:
        "Aujourd'hui j'ai conduit pour la première fois avec mon père. C'était stressant mais passionnant ! J'ai réussi à démarrer sans caler et à faire quelques kilomètres. Je suis fier de moi !",
      authorId: users.find((u) => u.role === "APPRENTICE")?.id || users[0].id,
      mediaUrls: [],
    },
    {
      title: "Conseils pour le stationnement en créneau",
      content:
        "Après plusieurs essais, j'ai enfin réussi à maîtriser le créneau ! Voici mes conseils: 1. Alignez-vous avec la voiture devant l'emplacement, 2. Tournez le volant complètement quand vous reculez, 3. Redressez au bon moment quand vous voyez l'angle. Quelqu'un a d'autres astuces ?",
      authorId: users.find((u) => u.role === "INSTRUCTOR")?.id || users[0].id,
      mediaUrls: [],
    },
    {
      title: "Question sur la priorité dans les ronds-points",
      content:
        "Je suis confus concernant la priorité dans les ronds-points. Est-ce que quelqu'un peut m'expliquer clairement comment ça fonctionne en Belgique ?",
      authorId:
        users.find((u) => u.email === "sophie.martin@example.com")?.id ||
        users[0].id,
      mediaUrls: [],
    },
  ];

  const createdPosts = [];
  for (const post of posts) {
    const created = await prisma.post.create({
      data: post,
    });
    createdPosts.push(created);
  }

  console.log(`✅ Created ${createdPosts.length} posts`);

  // Create comments
  const comments = [
    {
      content:
        "Félicitations pour ton premier jour ! La première fois est toujours impressionnante, ça ira de mieux en mieux.",
      authorId: users.find((u) => u.role === "GUIDE")?.id || users[1].id,
      postId: createdPosts[0].id,
    },
    {
      content: "Merci pour ces conseils, je vais essayer cette technique !",
      authorId:
        users.find((u) => u.email === "paul.dupont@example.com")?.id ||
        users[2].id,
      postId: createdPosts[1].id,
    },
    {
      content:
        "En Belgique, vous devez céder le passage aux véhicules déjà engagés dans le rond-point. C'est la règle de la priorité à gauche qui s'applique.",
      authorId: users.find((u) => u.role === "INSTRUCTOR")?.id || users[3].id,
      postId: createdPosts[2].id,
    },
    {
      content: "Et n'oubliez pas de signaler votre sortie avec le clignotant !",
      authorId: users.find((u) => u.role === "GUIDE")?.id || users[1].id,
      postId: createdPosts[2].id,
    },
  ];

  for (const comment of comments) {
    await prisma.comment.create({
      data: comment,
    });
  }

  console.log(`✅ Created ${comments.length} comments`);

  // Create likes
  const likes = [];
  for (const post of createdPosts) {
    // Add 1-3 random likes to each post
    const likersCount = Math.floor(Math.random() * 3) + 1;
    const potentialLikers = [...users]
      .sort(() => 0.5 - Math.random())
      .slice(0, likersCount);

    for (const user of potentialLikers) {
      likes.push({
        postId: post.id,
        userId: user.id,
      });
    }
  }

  for (const like of likes) {
    await prisma.like.create({
      data: like,
    });
  }

  console.log(`✅ Created ${likes.length} likes`);

  // Optional: Create session comments
  const sessions = await prisma.session.findMany({
    take: 2, // Just add comments to a couple of sessions
  });

  const sessionComments = [
    {
      content:
        "Belle progression sur cette séance, particulièrement sur les manœuvres en marche arrière.",
      authorId: users.find((u) => u.role === "GUIDE")?.id || users[1].id,
      sessionId: sessions[0]?.id,
    },
    {
      content:
        "Attention à bien vérifier les angles morts lors des changements de direction.",
      authorId: users.find((u) => u.role === "GUIDE")?.id || users[1].id,
      sessionId: sessions[1]?.id,
    },
  ];

  if (sessions.length > 0) {
    for (const comment of sessionComments) {
      if (comment.sessionId) {
        await prisma.comment.create({
          data: comment,
        });
      }
    }
    console.log(`✅ Created ${sessionComments.length} session comments`);
  }
}
