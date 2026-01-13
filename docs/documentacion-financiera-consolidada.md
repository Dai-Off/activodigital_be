# Documentación Consolidada - Módulo Financiero

## Índice

1. [Snapshots Financieros](#snapshots-financieros)
2. [Métricas Financieras](#métricas-financieras)
3. [Auditoría Financiera](#auditoría-financiera)
4. [Gestión de Facturas de Servicios](#gestión-de-facturas-de-servicios)
5. [Gastos Mensuales Automáticos](#gastos-mensuales-automáticos)
6. [Simulaciones y Escenarios Financieros](#simulaciones-y-escenarios-financieros)

---

## Snapshots Financieros

### ¿Qué es un Snapshot Financiero?

Un snapshot financiero es una captura en el tiempo de la situación financiera completa de un edificio. Representa el estado financiero del activo en un periodo específico (definido por fecha de inicio y fecha de fin).

### ¿Cómo se crea?

Se crea manualmente proporcionando todos los datos financieros del edificio para un periodo determinado. El sistema permite crear múltiples snapshots para diferentes periodos, pero solo puede existir un snapshot por combinación de edificio y periodo (si se crea otro con el mismo periodo, se actualiza el existente).

### ¿Qué datos contiene?

#### **Ingresos (Revenue)**
- **Ingresos brutos anuales**: Total de ingresos por alquileres y otros conceptos en EUR
- **Otros ingresos anuales**: Ingresos adicionales no relacionados con alquileres (parking, servicios, etc.)
- **WALT (Weighted Average Lease Term)**: Promedio ponderado de duración de contratos en meses
- **Concentración top inquilino**: Porcentaje del NOI que representa el inquilino más importante (0-100%)
- **Cláusula de indexación**: Indica si los contratos tienen cláusula de actualización de precios
- **Tasa de morosidad 12 meses**: Porcentaje de morosidad en los últimos 12 meses (0-100%)

#### **Gastos Operativos (OPEX)**
- **OPEX total anual**: Suma de todos los gastos operativos anuales en EUR
- **OPEX energía anual**: Gastos en electricidad, gas, agua, etc. en EUR
- **OPEX mantenimiento anual**: Gastos de mantenimiento y reparaciones en EUR
- **OPEX seguros anual**: Gastos de seguros del edificio en EUR
- **OPEX otros anual**: Otros gastos operativos no categorizados en EUR

#### **Deuda (Debt)**
- **DSCR (Debt Service Coverage Ratio)**: Ratio que indica la capacidad del activo para cubrir el servicio de deuda (debe ser > 1)
- **Servicio de deuda anual**: Pago anual de intereses y capital de la deuda en EUR
- **Penalidad prepago alta**: Indica si hay penalizaciones altas por prepago de deuda
- **Principal pendiente**: Monto pendiente del préstamo en EUR

#### **Rehabilitación (Rehab)**
- **CAPEX rehabilitación estimado**: Coste estimado de rehabilitación del edificio en EUR
- **Ahorro energía porcentaje estimado**: Porcentaje estimado de ahorro energético tras rehabilitación (0-100%)
- **Uplift precio porcentaje estimado**: Porcentaje estimado de revalorización del precio tras rehabilitación (0-100%)
- **Lead time rehabilitación semanas**: Tiempo estimado de ejecución de la rehabilitación en semanas

#### **Metadatos**
- **Periodo**: Fecha de inicio y fecha de fin del snapshot
- **Moneda**: Moneda en la que están expresados los valores (por defecto EUR)
- **Metadatos adicionales**: Información extra en formato JSON (versión, notas, etc.)

### ¿Para qué se usa?

Los snapshots financieros son la base de todos los cálculos financieros del sistema:
- Cálculo de métricas financieras (NOI, ROI, Cap Rate, DSCR, etc.)
- Auditorías financieras
- Simulaciones de escenarios
- Análisis de rentabilidad
- Proyecciones de flujos de caja

---

## Métricas Financieras

### ¿Qué métricas se calculan?

El sistema calcula automáticamente las siguientes métricas financieras a partir del snapshot más reciente y los datos del edificio:

#### **NOI (Net Operating Income)**
- **Qué es**: Ingresos operativos netos, es decir, ingresos totales menos gastos operativos
- **Cómo se calcula**: `NOI = (Ingresos brutos + Otros ingresos) - OPEX total`
- **Datos necesarios**: Snapshot financiero con ingresos y OPEX
- **Unidad**: EUR (anual o mensual según se solicite)

#### **ROI Operativo (Return on Investment)**
- **Qué es**: Retorno sobre la inversión operativo, indica qué porcentaje de retorno genera el activo
- **Cómo se calcula**: `ROI = (NOI / Valor de mercado) * 100`
- **Datos necesarios**: NOI y valor de mercado del edificio (campo `price` en la tabla de edificios)
- **Unidad**: Porcentaje (%)

#### **Cap Rate (Capitalization Rate)**
- **Qué es**: Tasa de capitalización, indica la rentabilidad del activo sin considerar financiación
- **Cómo se calcula**: `Cap Rate = (NOI / Valor de mercado) * 100` (mismo cálculo que ROI operativo)
- **Datos necesarios**: NOI y valor de mercado del edificio
- **Unidad**: Porcentaje (%)

#### **DSCR (Debt Service Coverage Ratio)**
- **Qué es**: Ratio de cobertura del servicio de deuda, indica si el activo genera suficiente flujo para pagar la deuda
- **Cómo se calcula**: Se obtiene directamente del snapshot financiero (no se recalcula)
- **Datos necesarios**: Snapshot financiero con DSCR
- **Unidad**: Número (debe ser > 1 para ser saludable)

#### **OPEX Ratio**
- **Qué es**: Porcentaje que representan los gastos operativos sobre los ingresos
- **Cómo se calcula**: `OPEX Ratio = (OPEX total / Ingresos brutos) * 100`
- **Datos necesarios**: Snapshot financiero con OPEX e ingresos
- **Unidad**: Porcentaje (%)

#### **Value Gap**
- **Qué es**: Diferencia entre el valor estimado del edificio y su valor de mercado actual
- **Cómo se calcula**: `Value Gap = ((Valor estimado - Valor de mercado) / Valor de mercado) * 100`
- **Datos necesarios**: Valor de mercado (`price`) y valor estimado (`potentialValue`) del edificio
- **Unidad**: Porcentaje (%)

### ¿Cómo se obtienen las métricas?

Las métricas se calculan en tiempo real cuando se solicitan, usando:
1. El snapshot financiero más reciente del edificio
2. Los datos básicos del edificio (valor de mercado, valor estimado)

Si no existe snapshot financiero, las métricas retornan `null` (excepto Value Gap que puede calcularse solo con datos del edificio).

### Temporalidad

Todas las métricas pueden obtenerse en formato:
- **Anual**: Valores para todo el año (por defecto)
- **Mensual**: Valores anuales divididos por 12

---

## Auditoría Financiera

### ¿Qué es una Auditoría Financiera?

Una auditoría financiera es un análisis completo y automatizado que evalúa:
1. **Estado financiero actual** del edificio
2. **Escenario post-mejoras** (proyección tras implementar mejoras)
3. **Completitud de datos** disponibles
4. **Recomendaciones financieras** automáticas

### ¿Cómo se realiza?

La auditoría se genera automáticamente cuando se solicita, integrando datos de múltiples fuentes:

1. **Datos del edificio**: Valor de mercado, superficie, coste de rehabilitación base
2. **Snapshot financiero más reciente**: Ingresos, OPEX, estimaciones de rehabilitación
3. **Auditoría técnica**: Mejoras energéticas recomendadas y ahorros potenciales
4. **Métricas financieras actuales**: ROI, NOI, Cap Rate (reutiliza cálculos existentes)

### ¿Qué analiza?

#### **1. Estado Financiero Actual**

Evalúa la situación financiera del edificio antes de mejoras:

- **Valor de mercado**: Obtenido del campo `price` del edificio
- **ROI operativo actual**: Calculado como `(NOI / Valor de mercado) * 100`
- **NOI actual**: Net Operating Income anual en EUR
- **Cap Rate actual**: Calculado como `(NOI / Valor de mercado) * 100`

#### **2. Escenario Post-Mejoras**

Proyecta la situación financiera tras implementar mejoras recomendadas:

**Inversión requerida:**
- **Rehabilitación base**: Coste de rehabilitación estructural (del snapshot o del edificio)
- **Mejoras energéticas**: Coste estimado de mejoras energéticas según auditoría técnica
  - Aislamiento térmico: ~80 EUR/m²
  - Ventanas eficientes: ~250 EUR/m²
  - Sistema calefacción: ~100 EUR/m²
  - Iluminación LED: ~20 EUR/m²
  - Energías renovables: ~150 EUR/m²
  - Sistema HVAC: ~120 EUR/m²
- **Inversión total**: Suma de rehabilitación base + mejoras energéticas

**Revalorización:**
- **Porcentaje de revalorización**: 
  - Prioridad 1: Usa el `uplift_precio_pct_estimado` del snapshot si existe
  - Prioridad 2: Estima según mejoras energéticas (0.5% por mejora alta prioridad, 0.3% por media, máximo 8%)
- **Valor futuro**: `Valor actual * (1 + revalorización%)`
- **Incremento de valor**: Diferencia entre valor futuro y valor actual

**Ahorros energéticos:**
- **Ahorros anuales estimados**:
  - Prioridad 1: Usa `ahorro_energia_pct_estimado` del snapshot si existe
  - Prioridad 2: Estima desde auditoría técnica usando `potentialSavingsKwhPerM2 * superficie * 0.15 EUR/kWh`
- **Incremento de NOI**: Equivale a los ahorros energéticos (los ahorros OPEX aumentan el NOI directamente)

**Retorno de la inversión:**
- **Payback (meses)**: Tiempo para recuperar la inversión
  - Fórmula: `(Inversión total / (Ahorros anuales + Incremento de valor/10)) * 12`
  - Considera ahorros energéticos + amortización del incremento de valor en 10 años
- **Ganancia neta**: `Incremento de valor - Inversión total` (no incluye ahorros OPEX, son flujos operativos)
- **ROI del proyecto**: `(Ganancia neta / Inversión total) * 100`
- **Nuevo Cap Rate**: `((NOI actual + Incremento NOI) / Valor futuro) * 100`

#### **3. Completitud de Datos**

Evalúa qué datos están disponibles para el análisis:

- **Tiene snapshot financiero**: Indica si existe snapshot más reciente
- **Tiene mejoras energéticas**: Indica si hay mejoras identificadas en auditoría técnica
- **Tiene precio del edificio**: Indica si el edificio tiene valor de mercado registrado
- **Score de completitud**: 0-100 puntos
  - 40 puntos: Si tiene precio del edificio
  - 40 puntos: Si tiene snapshot financiero
  - 20 puntos: Si tiene mejoras energéticas

#### **4. Recomendaciones Automáticas**

Genera recomendaciones basadas en el análisis:

**Por datos faltantes:**
- Si falta precio del edificio → "Registre el valor de mercado del edificio para obtener análisis financiero completo"
- Si falta snapshot financiero → "Cree un snapshot financiero del edificio para cálculos más precisos"
- Si faltan mejoras energéticas → "Complete la auditoría técnica para identificar mejoras energéticas rentables"

**Por ROI del proyecto:**
- ROI > 20% → "El proyecto de mejoras presenta un ROI excelente (>20%). Altamente recomendable."
- ROI 10-20% → "El proyecto de mejoras presenta un ROI positivo (>10%). Recomendable."
- ROI 0-10% → "El proyecto de mejoras presenta un ROI modesto. Evalúe prioridades."
- ROI < 0% → "El ROI del proyecto es negativo. Considere solo mejoras prioritarias o de cumplimiento normativo."

**Por payback:**
- ≤ 60 meses (5 años) → "Periodo de recuperación favorable: X años"
- 61-120 meses (10 años) → "Periodo de recuperación moderado: X años"
- > 120 meses → "Periodo de recuperación largo: X años. Priorice mejoras de alto impacto."

**Por ROI actual:**
- ROI < 3% → "ROI actual bajo (<3%). Las mejoras pueden aumentar significativamente la rentabilidad."
- ROI ≥ 6% → "ROI actual saludable (>=6%). Las mejoras pueden optimizarlo aún más."

**Por Cap Rate:**
- Si el nuevo Cap Rate aumenta > 0.5 puntos porcentuales → "Las mejoras incrementarían el Cap Rate en Xpp, aumentando el atractivo del activo"

**Por ahorros energéticos:**
- Si hay ahorros estimados > 0 → "Ahorros energéticos estimados: Xk EUR/año mejoran la rentabilidad operativa"

### Limitaciones actuales

**IMPORTANTE**: Los valores de costes y estimaciones están actualmente hardcodeados con valores de referencia para permitir pruebas. Estos valores NO están basados en análisis de mercado actualizados.

**Limitaciones:**
1. **Costes genéricos**: Los costes por m² son valores de referencia que no consideran ubicación, estado del edificio, complejidad, precios locales, inflación
2. **Revalorización estimada**: El uplift de precio es conservador y no considera mercado inmobiliario local, demanda del área, comparables, tipología del activo
3. **Precio energía fijo**: Se usa 0.15 EUR/kWh sin considerar contrato energético actual, tarifa específica, evolución de precios
4. **Payback simplificado**: No considera financiación (coste del capital), inflación, escalada de costes, subvenciones disponibles, impuestos
5. **ROI simplificado**: No incluye análisis de múltiples años, valor presente neto (NPV), tasa interna de retorno (IRR), análisis de sensibilidad, escenarios múltiples

**Mejoras necesarias:**
- Base de datos de costes por región y tipología
- Integración con APIs de valoración para precios de mercado actualizados
- Análisis financiero avanzado (NPV, IRR, análisis de sensibilidad)
- Integración con subvenciones disponibles
- Datos energéticos reales desde contratos

---

## Gestión de Facturas de Servicios

### ¿Qué son las Facturas de Servicios?

Las facturas de servicios son los documentos de pago de los servicios básicos del edificio:
- **Electricidad**: Facturas de consumo eléctrico
- **Agua**: Facturas de consumo de agua
- **Gas**: Facturas de consumo de gas
- **IBI**: Impuesto sobre Bienes Inmuebles
- **Basuras**: Gastos de recogida de basuras

### ¿Cómo se gestionan?

Se crean manualmente proporcionando la información de cada factura. El sistema almacena cada factura individualmente y las utiliza para calcular automáticamente los gastos mensuales.

### ¿Qué datos contiene cada factura?

**Datos requeridos:**
- **Edificio**: ID del edificio al que pertenece
- **Tipo de servicio**: electricity, water, gas, ibi, waste
- **Fecha de factura**: Fecha de emisión de la factura (se usa para determinar el mes del gasto)
- **Importe**: Monto de la factura en EUR

**Datos opcionales:**
- **Número de factura**: Número de factura del proveedor
- **Unidades**: Unidades consumidas (kWh para electricidad, m³ para agua/gas, etc.)
- **Periodo inicio/fin**: Fechas del periodo que cubre la factura
- **URL documento**: Enlace al PDF o imagen de la factura
- **Nombre archivo**: Nombre del archivo del documento
- **Proveedor**: Nombre del proveedor del servicio
- **Notas**: Notas adicionales sobre la factura

### ¿Cómo se agrupan?

Las facturas se agrupan automáticamente por mes y año según su fecha de factura. Por ejemplo:
- Factura de electricidad del 15 de diciembre de 2024 → se agrupa en diciembre 2024
- Factura de agua del 20 de diciembre de 2024 → se agrupa en diciembre 2024

Si hay múltiples facturas del mismo tipo en el mismo mes, se suman automáticamente.

### Operaciones disponibles

- **Crear factura**: Registrar una nueva factura de servicio
- **Actualizar factura**: Modificar datos de una factura existente (si cambia la fecha, se recalcula el mes)
- **Eliminar factura**: Eliminar una factura (se recalcula el mes correspondiente)
- **Consultar facturas**: Ver facturas de un edificio, filtradas por tipo, año, mes

---

## Gastos Mensuales Automáticos

### ¿Qué son los Gastos Mensuales?

Los gastos mensuales son el resumen agregado de todos los gastos de servicios de un edificio agrupados por mes y año. Se calculan automáticamente desde las facturas de servicios.

### ¿Cómo se calculan?

Los gastos mensuales se calculan automáticamente mediante triggers en la base de datos cuando:
- Se crea una nueva factura de servicio
- Se actualiza una factura de servicio (importe, fecha, tipo, etc.)
- Se elimina una factura de servicio

**Proceso automático:**
1. El sistema identifica el mes y año de la factura según su fecha
2. Suma todas las facturas del mismo tipo que pertenecen al mismo mes/año
3. Crea o actualiza el registro de gasto mensual correspondiente
4. Calcula el total mensual sumando todos los tipos de servicios

### ¿Qué datos contiene cada gasto mensual?

**Por tipo de servicio (en EUR):**
- Electricidad
- Agua
- Gas
- IBI
- Basuras

**Por tipo de servicio (unidades):**
- Unidades de electricidad (kWh)
- Unidades de agua (m³)
- Unidades de gas (m³)
- Unidades de IBI (opcional)
- Unidades de basuras (opcional)

**Totales:**
- **Total mensual**: Suma de todos los gastos del mes en EUR

**Metadatos:**
- Año y mes
- Notas adicionales (opcionales)
- Fechas de creación y actualización

### ¿Cómo se consultan?

Los gastos mensuales son de solo lectura. Se pueden consultar:
- **Por edificio**: Todos los gastos mensuales de un edificio
- **Por año**: Gastos de un año específico
- **Por mes específico**: Gasto de un mes y año específicos
- **Resumen anual**: Total anual, promedio mensual y desglose por tipo de servicio

### Características importantes

- **Unicidad**: Solo puede existir un registro por combinación de edificio, año y mes
- **Actualización automática**: Si se agregan más facturas del mismo mes/año, el mismo registro se actualiza (UPSERT)
- **Solo lectura**: No se pueden crear, actualizar o eliminar directamente. Para modificar gastos, se gestionan las facturas de servicios.

---

## Simulaciones y Escenarios Financieros

### ¿Qué son las Simulaciones?

Las simulaciones permiten analizar escenarios "what-if" para evaluar la viabilidad financiera de inversiones o cambios en el edificio. Permiten pasar parámetros personalizados y ver el impacto financiero.

### Tipos de Simulaciones

#### **1. Simulación de Rehabilitación**

**¿Qué hace?**
Simula una rehabilitación del edificio y calcula si es rentable.

**¿Qué datos necesita?**
- **Coste de rehabilitación**: Monto de la inversión en EUR
- **Ahorro energético anual** (opcional): Si no se proporciona, se calcula del snapshot
- **Subsidios** (opcional): Monto de subvenciones disponibles en EUR
- **Meses para ejecutar** (opcional): Tiempo estimado de ejecución

**¿Qué calcula?**
- **Valor estimado**: Valor del edificio después de la rehabilitación
- **Value Gap**: Diferencia porcentual entre valor estimado y valor de mercado
- **Payback (meses)**: Meses necesarios para recuperar la inversión
  - Fórmula: `(Coste rehabilitación / (Ahorro anual + Subsidios)) * 12`
- **ROI simple**: ROI anual de la inversión
  - Fórmula: `((Ahorro anual + Subsidios) / Coste rehabilitación) * 100`

**¿Para qué sirve?**
- Responder: "¿Vale la pena rehabilitar con 50k?"
- Comparar: "¿Mejor invertir 50k o 100k?"
- Justificar: "¿Cuánto tiempo tardo en recuperar mi inversión?"

#### **2. Proyección de Flujos de Caja**

**¿Qué hace?**
Genera una proyección de flujos de caja futuros del edificio.

**¿Qué datos necesita?**
- **Años a proyectar** (opcional): Número de años, 1-30 (por defecto: 5)
- **Periodo** (opcional): annual o monthly (por defecto: annual)
- **Tasa de descuento** (opcional): Tasa para cálculos de NPV/IRR (por defecto: 8%)

**¿Qué calcula?**
- **Flujos de caja proyectados**: Array de flujos futuros (NOI anual o mensual)
  - Se calcula desde el snapshot: `NOI = Ingresos - OPEX`
  - Se proyecta ese NOI para los próximos X años
- **Inversión inicial**: Coste de rehabilitación del edificio (si existe)

**¿Para qué sirve?**
- Base para cálculos de NPV e IRR
- Proyección: "¿Cuánto dinero generará este edificio en 5 años?"
- Planificación: Ver los flujos futuros antes de decidir

#### **3. Cálculo de NPV (Net Present Value)**

**¿Qué hace?**
Calcula el Valor Presente Neto de una inversión. Descuenta cada flujo futuro al presente usando una tasa de descuento y resta la inversión inicial.

**¿Qué datos necesita?**
- **Tasa de descuento** (requerido): Tasa de descuento, 0-1 (ej: 0.08 = 8%)
- **Flujos de caja** (requerido): Array de flujos de caja futuros
- **Inversión inicial** (requerido): Monto de la inversión en EUR

**¿Qué calcula?**
- **NPV**: Valor presente neto
  - Fórmula: `NPV = -Inversión inicial + Σ(Flujo[i] / (1 + tasa)^(i+1))`
  - Si NPV > 0 → rentable
  - Si NPV < 0 → no rentable

**¿Para qué sirve?**
- Decisión: "¿Vale la pena invertir 300k?"
- Comparación: "¿Qué inversión es mejor?"
- Valor del dinero en el tiempo: Considera que 100 EUR hoy valen más que 100 EUR en 5 años

#### **4. Cálculo de IRR (Internal Rate of Return)**

**¿Qué hace?**
Calcula la Tasa Interna de Retorno: la tasa de descuento que hace que el NPV sea igual a 0. Es la tasa de retorno efectiva que genera la inversión.

**¿Qué datos necesita?**
- **Flujos de caja** (requerido): Array de flujos de caja futuros
- **Inversión inicial** (requerido): Monto de la inversión en EUR
- **Máximo de iteraciones** (opcional): Para el cálculo (por defecto: 100)
- **Tolerancia** (opcional): Para convergencia (por defecto: 0.0001)

**¿Qué calcula?**
- **IRR**: Tasa interna de retorno (0-1, ej: 0.325 = 32.5%)
  - Se calcula usando método Newton-Raphson
  - Si no converge, retorna `null`
- **Iteraciones**: Número de iteraciones necesarias para calcular

**¿Para qué sirve?**
- Retorno: "¿Qué tasa de retorno genera esta inversión?"
- Comparación: "¿Esta inversión es mejor que poner dinero en el banco?"
- Benchmark: Si el banco da 5% y el IRR es 32%, es mucho mejor

**Diferencia con NPV:**
- NPV: Dice si es rentable (Sí/No) y cuánto valor genera
- IRR: Dice qué tasa de retorno genera (32%, 15%, etc.)

#### **5. Análisis de Sensibilidad**

**¿Qué hace?**
Prueba cómo cambia el NPV con diferentes tasas de descuento. Calcula el NPV para múltiples tasas (2%, 4%, 6%, 8%, 10%, 12%, 15%) y devuelve una tabla de sensibilidad.

**¿Qué datos necesita?**
- **Tasa de descuento base** (requerido): Tasa base, 0-1
- **Flujos de caja base** (requerido): Array de flujos de caja base
- **Inversión inicial** (requerido): Monto de la inversión en EUR
- **Rango de tasas** (opcional): Array de tasas a probar (por defecto: [0.02, 0.04, 0.06, 0.08, 0.10, 0.12, 0.15])

**¿Qué calcula?**
- **Tabla de sensibilidad**: Array con cada tasa y su NPV correspondiente
- **NPV base**: NPV con la tasa base

**¿Para qué sirve?**
- Robustez: "¿Qué pasa si suben las tasas de interés?"
- Riesgo: "¿Sigue siendo rentable si cambian las condiciones?"
- Planificación: Saber cómo responde la inversión a cambios en el mercado

**Interpretación:**
- Si todos los NPVs son positivos → inversión robusta
- Si algunos NPVs son negativos → inversión sensible a cambios
- Si NPV baja mucho con tasas altas → inversión de alto riesgo

### Flujo típico de uso

1. **Generar flujos de caja**: Proyectar flujos futuros del edificio
2. **Calcular NPV**: Evaluar si es rentable con una tasa de descuento
3. **Calcular IRR**: Ver qué tasa de retorno genera
4. **Análisis de sensibilidad**: Ver robustez ante cambios en tasas

### Escenarios Reproducibles

Todas las simulaciones soportan un `scenarioId` para reproducir escenarios:
- Si se proporciona un `scenarioId`, el sistema lo usa y lo devuelve
- Si no se proporciona, se genera automáticamente
- Mismo `scenarioId` + mismos inputs = mismo output (idempotencia)

---

## Resumen de Datos Necesarios

### Para calcular métricas financieras básicas:
- Snapshot financiero con ingresos y OPEX
- Valor de mercado del edificio (`price`)

### Para realizar auditoría financiera:
- Snapshot financiero más reciente
- Auditoría técnica (mejoras energéticas)
- Valor de mercado del edificio
- Superficie del edificio
- Coste de rehabilitación base (opcional)

### Para gestionar gastos de servicios:
- Facturas de servicios con fecha e importe

### Para simulaciones:
- Snapshot financiero (para flujos de caja base)
- Parámetros de la simulación (coste, tasa de descuento, etc.)

---

## Notas Finales

### Valores de referencia actuales

Los siguientes valores están hardcodeados como referencia y deben mejorarse con datos reales:

- **Costes por m² de mejoras energéticas**: Valores de referencia (80-250 EUR/m² según tipo)
- **Precio de electricidad**: 0.15 EUR/kWh (precio medio)
- **Revalorización máxima**: 8% (límite conservador)
- **Amortización en payback**: 10 años

