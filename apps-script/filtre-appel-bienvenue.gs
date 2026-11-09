/**
 * Filtre d'Appel – Envoi automatique de la procédure aux nouveaux membres du groupe Google.
 *
 * Installation :
 *  1. Ouvrir https://script.google.com > Nouveau projet, coller ce fichier.
 *  2. Remplacer GROUP_EMAIL par l'adresse du groupe des testeurs.
 *  3. Choisir la fonction « installer » puis cliquer Exécuter (accepter les autorisations).
 * C'est tout : le script vérifie ensuite le groupe toutes les 15 minutes.
 */

const GROUP_EMAIL = 'testeurs-filtre-dappel@googlegroups.com';
const VIDEO_FILE_IDS = [
  '1S-7pY19LNsX6gugtX5n0bMS_bOQ_smWs', // pub Filtre_Appel.mp4 (7 Mo)
  '1FCpTMu3PqfalwJX-v7rBIeTRw006GmEu', // Activation_v3_Reels_TikTok_Shorts.mp4 (8 Mo)
];
const SUJET = "Filtre d'Appel – Votre procédure d'installation";

const HTML = `
<p>Bonjour,</p>
<p>Bienvenue dans le groupe des testeurs de <b>Filtre d'Appel</b> ! Voici la procédure pour installer l'application. Vous trouverez aussi en pièce jointe la vidéo de présentation de Filtre d'Appel.</p>
<p><b>⚠️ Important :</b> utilisez sur votre téléphone le <b>même compte Google</b> que celui avec lequel vous avez rejoint le groupe.</p>
<p><b>1. Devenez testeur</b><br>
Ouvrez ce lien et appuyez sur « Devenir testeur » :<br>
<a href="https://play.google.com/apps/testing/fr.vincent.filtreappels">https://play.google.com/apps/testing/fr.vincent.filtreappels</a></p>
<p><b>2. Installez l'application</b><br>
Depuis votre téléphone Android, ouvrez :<br>
<a href="https://play.google.com/store/apps/details?id=fr.vincent.filtreappels">https://play.google.com/store/apps/details?id=fr.vincent.filtreappels</a><br>
puis appuyez sur « Installer ». Si l'application n'apparaît pas encore, patientez quelques minutes et réessayez.</p>
<p><b>3. Activez le filtrage</b><br>
Ouvrez Filtre d'Appel et autorisez-la comme application de filtrage des appels quand Android vous le demande. La vidéo « Activation » jointe à ce mail vous montre l'activation pas à pas.</p>
<p><b>4. Réglez vos règles</b><br>
Choisissez ce que vous voulez bloquer : préfixes de démarchage, numéros masqués, numéros usurpés, mode strict, liste noire et liste blanche.</p>
<p>Un souci ou une suggestion ? Répondez simplement à ce mail, vos retours de testeur sont précieux.</p>
<p>Merci pour votre aide !<br>Vincent</p>`;

/** À lancer une seule fois : mémorise les membres actuels et programme la vérification toutes les 15 min. */
function installer() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  PropertiesService.getScriptProperties().setProperty('membres', JSON.stringify(listerMembres_()));
  ScriptApp.newTrigger('verifierNouveauxMembres').timeBased().everyMinutes(15).create();
  Logger.log('Installé. Membres actuels mémorisés (ils ne recevront pas de mail).');
}

/** Lancée automatiquement : envoie la procédure à chaque nouveau membre. */
function verifierNouveauxMembres() {
  const props = PropertiesService.getScriptProperties();
  const actuels = listerMembres_();
  // On oublie les personnes qui ont quitté le groupe : si elles reviennent, elles recevront à nouveau la procédure.
  const connus = JSON.parse(props.getProperty('membres') || '[]').filter(e => actuels.includes(e));
  props.setProperty('membres', JSON.stringify(connus));
  const nouveaux = actuels.filter(e => !connus.includes(e));
  if (nouveaux.length === 0) return;

  const videos = piecesJointes_();
  nouveaux.forEach(email => {
    GmailApp.sendEmail(email, SUJET, "Ouvrez ce mail en HTML pour voir la procédure.", {
      htmlBody: HTML,
      attachments: videos,
      name: "Vincent – Filtre d'Appel",
    });
    connus.push(email);
    props.setProperty('membres', JSON.stringify(connus)); // enregistré après chaque envoi : jamais de doublon
    Logger.log('Procédure envoyée à ' + email);
  });
}

/** Pour tester : s'envoie le mail à soi-même. */
function testerEnvoi() {
  GmailApp.sendEmail(Session.getActiveUser().getEmail(), SUJET, '', {
    htmlBody: HTML,
    attachments: piecesJointes_(),
    name: "Vincent – Filtre d'Appel",
  });
}

/** Diagnostic : affiche dans le journal les membres vus par le script et ceux déjà mémorisés. */
function afficherMembres() {
  Logger.log('Membres vus par le script : ' + JSON.stringify(listerMembres_()));
  Logger.log('Membres déjà mémorisés : ' + PropertiesService.getScriptProperties().getProperty('membres'));
}

/** Pour retester : « oublie » une adresse, qui recevra le mail à la prochaine vérification. */
function oublierAdresse() {
  const ADRESSE = 'lefeez@wanadoo.fr'; // ← adresse à retester
  const props = PropertiesService.getScriptProperties();
  const connus = JSON.parse(props.getProperty('membres') || '[]').filter(e => e !== ADRESSE.toLowerCase());
  props.setProperty('membres', JSON.stringify(connus));
  Logger.log(ADRESSE + ' oubliée. Lancez verifierNouveauxMembres pour tester tout de suite.');
}

function piecesJointes_() {
  return VIDEO_FILE_IDS.map(id => DriveApp.getFileById(id).getBlob());
}

function listerMembres_() {
  return GroupsApp.getGroupByEmail(GROUP_EMAIL).getUsers().map(u => u.getEmail().toLowerCase());
}
