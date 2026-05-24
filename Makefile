.PHONY: help up api web stop seed fresh migrate tinker routes test lint fe-build

help:           ## Muestra esta ayuda
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

up:             ## Arranca backend (:8000) y frontend (:5173) en paralelo
	@trap 'kill 0' INT; \
	(cd backend && php artisan serve) & \
	(cd frontend && npm run dev) & \
	wait

api:            ## Solo backend Laravel en :8000
	cd backend && php artisan serve

web:            ## Solo frontend Vite en :5173
	cd frontend && npm run dev

stop:           ## Mata procesos colgados en :8000 y :5173
	-lsof -ti:8000 | xargs kill -9 2>/dev/null || true
	-lsof -ti:5173 | xargs kill -9 2>/dev/null || true

seed:           ## migrate:fresh + seeders (imprime passwords)
	cd backend && php artisan migrate:fresh --seed

fresh: seed     ## Alias de seed

migrate:        ## Solo migrate (sin fresh)
	cd backend && php artisan migrate

tinker:         ## Abre tinker
	cd backend && php artisan tinker

routes:         ## Lista rutas API
	cd backend && php artisan route:list --path=api

test:           ## Tests del backend
	cd backend && php artisan test

lint:           ## Lint del frontend
	cd frontend && npm run lint

fe-build:       ## Build de producción del frontend
	cd frontend && npm run build
