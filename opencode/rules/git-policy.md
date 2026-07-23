# Politica Git

## Permitido (inspeccion)

- `git status` — ver estado del working tree.
- `git diff` — ver cambios pendientes.
- `git log` — ver historial de commits.
- `git branch -a` — listar ramas existentes.
- `git remote -v` — ver URLs de remotes.
- `git show` — ver contenido de un commit.

## Requiere autorizacion explicita

- `git checkout` / `git switch` — cambiar de rama.
- `git commit` — crear un commit.
- `git push` — enviar cambios a un remote.
- `git merge` / `git rebase` — integrar ramas.
- `git reset` / `git stash` — modificar el estado del working tree.
- `git branch -d` — eliminar una rama.

## Regla fundamental

- Nunca ocultar cambios existentes del usuario.
- Antes y despues de editar archivos, reportar el conjunto de archivos afectados
  en la respuesta al usuario.
