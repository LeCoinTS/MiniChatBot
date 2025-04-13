import * as path from "path"
import * as fs from "fs/promises"
import * as readline from "readline"

// Chemin et nom du fichier JSON (qui contient toutes les règles questions/réponses)
const cheminVersFichierJSON: string = path.join(process.cwd(), "src")
const nomDuFichierJSON: string = "regles.json"

// Interface de chaque règle
interface Regle {
  pattern: string | RegExp
  responses: string[] // tableau de string ici, pour proposer une des réponses possibles à chaque fois
  isRegex: boolean
}

// Créer une interface utilisateur (pour capturer les saisies au clavier et les afficher à l'écran)
const userInterface: readline.Interface = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

// Tableau des règles (vide au départ, en attendant de charger les données JSON)
const regles: Regle[] = []

// Message d'accueil du chat-bot
const messageAccueil: string = `
*****************************************************************************************************************
Salut ! Je suis un MiniChatBot, créé par un développeur un peu fou, en 2025 ! À l’origine, j’étais juste
un bout de code pour répondre à des 'bonjour', mais j’ai grandi en rêvant de devenir un compagnon utile ;)
J’aime bien discuter, faire sourire les gens, mais suis quelque peu maladroit avec les questions compliquées... !
Après tout, je ne suis encore qu'un bébé, dans le monde des bots ;)
*****************************************************************************************************************`

// ==================================================================
// Fonction de chargement des règles (contenues dans un fichier JSON)
// ==================================================================
const chargerRegles = async (): Promise<void | never> => {
  // Vidange du tableau des règles (car en cas de reload, ce tableau contien déjà les anciennes valeurs, qu'il faut virer)
  regles.splice(0, regles.length)

  // Chargement des règles...
  try {
    const fichierJSONaLire: string = path.join(cheminVersFichierJSON, nomDuFichierJSON)
    const donneesJSONauFormatTexte: string = await fs.readFile(fichierJSONaLire, "utf8")
    const donneesJSONmisDansUnTableauDeRegle: Regle[] = JSON.parse(donneesJSONauFormatTexte)

    donneesJSONmisDansUnTableauDeRegle.forEach((regle) => {
      // On stocke chaque règles une à une dans notre tableau, en créant une regex au besoin au niveau du pattern
      regles.push({
        ...regle,
        pattern: regle.isRegex ? new RegExp(regle.pattern, "i") : regle.pattern,
      })
    })
    // Règles chargées, on sort !
  } catch (error) {
    console.error("\n[ERREUR] Impossible de charger les règles, désolé\n")
    console.error("Erreur détaillée :", error)
    userInterface.close()
    process.exit(1)
  }
}

// =========================================================================================
// Fonction de récupération d'une réponse, à partir de toutes celles contenues dans regles[]
// =========================================================================================
const recupereUneReponse = (texteSaisiParUtilisateur: string): string => {
  // On met le texte entré en minuscule, pour ne pas être sensible à la casse
  const texteSaisiMisEnMinuscule: string = texteSaisiParUtilisateur.toLowerCase()

  // Parcours de toutes les règles, pour voir s'il y en a une qui match avec ce qu'a saisi l'utilisateur
  for (const regle of regles) {
    // En excluant le cas particulier de la "réponse par défaut"
    if (typeof regle.pattern === "string" && regle.pattern === "default") {
      continue
    }
    if (regle.pattern instanceof RegExp && regle.pattern.test(texteSaisiMisEnMinuscule)) {
      // Si la pattern est de type RegExp, on utilise un "pattern.test"
      return regle.responses[Math.floor(Math.random() * regle.responses.length)] // Choix aléatoire
    } else if (typeof regle.pattern === "string" && texteSaisiMisEnMinuscule.includes(regle.pattern)) {
      // Si la pattern est de type string, on utilise un "texte.includes"
      return regle.responses[Math.floor(Math.random() * regle.responses.length)] // Choix aléatoire
    }
  }

  // Si aucune règle ne correspond au texte saisi, on retourne une réponse par défaut
  const defaultRegle: Regle | undefined = regles.find((regle) => regle.pattern === "default")
  return defaultRegle ? defaultRegle.responses[Math.floor(Math.random() * defaultRegle.responses.length)] : "Je suis perdu... !"
}

// ===================
// Fonction principale
// ===================
const main = async (): Promise<void> => {
  console.log(messageAccueil)

  // Chargement des règles
  await chargerRegles()

  // Mise en place d'une écoute au niveau du clavier
  console.log("\nTape quelque chose (ou 'exit' pour quitter), et je te répondrais !\n")

  userInterface
    // Cas où l'utilisateur aurait saisi quelque chose, et appuyé sur ENTREE ensuite
    .on("line", async (texteSaisiParUtilisateur) => {
      if (texteSaisiParUtilisateur.toLowerCase() === "exit") {
        // Si "exit" est tapé au clavier, alors on quitte l'app
        console.log("MiniChatBot : À la prochaine !")
        userInterface.close()
        return
      } else if (texteSaisiParUtilisateur.toLowerCase() === "reload") {
        // Si "reload" est tapé au clavier, alors on recharge les règles contenues dans le fichier JSON
        await chargerRegles()
        console.log("MiniChatBot : Règles rechargées !")
        userInterface.prompt() // Pour réafficher le ">" d'invite à saisir du texte, au niveau de la console
      } else {
        // Sinon, on récupère une des réponses possibles en fonction du texte saisi par l'utilisateur
        const responseDuChatbot: string = recupereUneReponse(texteSaisiParUtilisateur)
        console.log(`MiniChatBot : ${responseDuChatbot}`)

        // Et on réaffiche le ">" après la réponse du bot, pour indiquer
        // à l'utilisateur qu'il peut à nouveau taper une nouvelle question
        userInterface.prompt()
      }
    })
    // Cas où il est demandé à l'interface utilisateur de se fermer
    .on("close", () => {
      console.log("\nChat terminé.")
    })

  // Affichage d'un ">" initial à l'écran, signifiant l'attention d'une première saisie par l'utilisateur
  userInterface.prompt()

  // Nota : ce programme ne s'arrête pas, tant que userInterface.close() n'est pas appelé (ou CTRL+C tapé au clavier !)
}

// ======================
// Lancement de l'app ici
// ======================
main()
