# Calculadora de Limites

Uma calculadora didática que estima numericamente o limite de uma função real em um ponto ou quando `x` tende ao infinito. Além do resultado, ela mostra os limites laterais, uma tabela de aproximação, um gráfico e sugestões de técnicas algébricas.

## Como abrir

1. Baixe ou clone este repositório.
2. Abra o arquivo `calculadora-de-limites.html` em um navegador atualizado.
3. Não é necessário instalar dependências nem iniciar um servidor.

Os arquivos `styles.css` e `script.js` precisam permanecer na mesma pasta do HTML.

## Como utilizar

1. No campo **f(x)**, digite a função que deseja analisar.
2. No campo **x tende a**, informe o ponto. Para analisar o comportamento no infinito, use `inf` ou `-inf`.
3. Clique em **Calcular** ou pressione Enter em um dos campos.
4. Consulte o resultado, os limites laterais, a tabela de valores próximos e o gráfico.
5. Se preferir, clique em um dos exemplos prontos para preencher os campos e calcular automaticamente.

## Expressões aceitas

| Tipo | Formas aceitas | Exemplo |
| --- | --- | --- |
| Operações | `+`, `-`, `*`, `/` e `^` (potência) | `(x^2 - 4) / (x - 2)` |
| Multiplicação implícita | Um número ou parêntese ao lado de `x` ou de outra expressão | `2x`, `3(x + 1)` |
| Agrupamento | Parênteses; colchetes também são convertidos em parênteses | `(x + 1) / [x - 2]` |
| Raízes | `sqrt(x)` e `cbrt(x)` | `sqrt(x) - 3` |
| Trigonometria | `sen(x)`, `sin(x)`, `cos(x)`, `tan(x)` | `sen(5x) / x` |
| Trigonométricas inversas | `arcsen(x)`, `arcsin(x)`, `arccos(x)`, `arctan(x)` | `arcsen(x)` |
| Outras funções | `abs(x)`, `exp(x)`, `ln(x)`, `log(x)` | `ln(x)` |
| Constantes | `pi`, `π` e `e` | `pi * x` |

As funções trigonométricas usam radianos. `ln(x)` é o logaritmo natural e `log(x)` é o logaritmo na base 10. A calculadora aceita vírgula ou ponto como separador decimal.

## Exemplos

| Função | Ponto | Resultado esperado |
| --- | --- | --- |
| `(x^2 - 4) / (x - 2)` | `2` | Aproximadamente `4` |
| `sen(5x) / x` | `0` | Aproximadamente `5` |
| `(2x + 5) / (x - 3)` | `3` | Limites laterais diferentes |
| `(3x^2 + 2x) / (5x^2 - 7)` | `inf` | Aproximadamente `0,6` |

## Como a estimativa funciona

Para um ponto finito, a calculadora avalia a função dos dois lados do ponto, usando valores cada vez mais próximos. Para `inf` e `-inf`, avalia valores de `x` cada vez maiores em módulo. Compara os resultados para estimar se cada limite lateral converge, cresce sem limite ou não converge para um valor único.

O gráfico é desenhado a partir de amostras da função. A linha tracejada marca o ponto analisado e, quando há um resultado finito, o valor estimado do limite. A tabela mostra os valores usados na aproximação. As mensagens abaixo do resultado sugerem técnicas matemáticas que podem ser úteis.

## Importante

Este é um recurso de apoio e verificação, não um sistema de demonstração algébrica. Como usa um número finito de amostras e tolerâncias numéricas, pode não identificar corretamente casos de convergência muito lenta, oscilações, descontinuidades complexas ou valores próximos aos limites de precisão do navegador. Use a resolução algébrica para confirmar o resultado.
