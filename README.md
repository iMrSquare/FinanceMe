# FinanceMe

Aplicación web de gestión financiera personal y del hogar. Permite registrar gastos, ingresos, préstamos, servicios (luz, agua) y suscripciones, con estadísticas por mes.

> **Aviso de seguridad:** Esta aplicación está diseñada para uso en red local o privada. **No se recomienda exponerla directamente a internet** sin un proxy inverso con HTTPS, autenticación adicional y el hardening adecuado.

---

## Requisitos

- [Docker](https://docs.docker.com/get-docker/) y [Docker Compose](https://docs.docker.com/compose/install/)

## Instalación

### 1. Clonar o descargar el repositorio

```bash
git clone https://github.com/imrsquare/financeme.git
cd financeme
```

### 2. Configurar las variables de entorno

```bash
cp .env.example .env
```

Edita `.env` y asigna un valor seguro a `JWT_SECRET`:

```bash
# Genera un secreto aleatorio con:
openssl rand -base64 48
```

### 3. Levantar la aplicación

```bash
docker compose up -d
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

### 4. Primer acceso

En el primer arranque se crea automáticamente un usuario administrador con las credenciales por defecto. **Cámbialas inmediatamente** desde el perfil o la sección de ajustes.

---

## Parar la aplicación

```bash
docker compose down
```

Los datos persisten en el directorio `./data/` (volumen local).

## Actualizar a la última versión

```bash
docker compose pull && docker compose up -d
```

---

## Variables de entorno

| Variable     | Descripción                                                                 | Requerida |
|--------------|-----------------------------------------------------------------------------|-----------|
| `JWT_SECRET` | Secreto para firmar los tokens de sesión. Mínimo 32 caracteres aleatorios. | Sí        |
| `HTTPS`      | Poner a `true` solo si el tráfico llega directamente por HTTPS sin proxy.  | No        |

---

## Licencia

MIT — ver [LICENSE](LICENSE).
