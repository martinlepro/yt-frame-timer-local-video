# yt-frame-timer

Outil navigateur pour calculer la durée entre deux points d’une vidéo.

## Utilisation
- Ouvre `index.html` dans un navigateur récent.
- Dans **Vidéo locale**, choisis un fichier vidéo sur ton appareil. Le fichier est lu localement avec le lecteur HTML5, sans envoi vers un serveur.
- Indique le FPS de la vidéo, puis utilise **Image précédente** / **Image suivante** pour avancer par pas d’une image.
- Clique sur **Définir le départ ici** et **Définir la fin ici** aux positions voulues, puis sur **Calculer la durée**.
- Tu peux aussi saisir directement les temps en secondes, avec décimales.

Note : le navigateur ne permet pas toujours un positionnement parfaitement exact sur chaque image selon le codec et le navigateur. Le pas d’image dépend du FPS saisi. Un élément `iframe` n’est pas adapté à la lecture directe d’un fichier local ; le lecteur vidéo HTML5 remplit ce rôle pour les fichiers choisis sur l’appareil.

Le projet original était destiné à retimer des vidéos YouTube pour la vérification de speedruns.
"# yt-frame-timer-local-video" 
