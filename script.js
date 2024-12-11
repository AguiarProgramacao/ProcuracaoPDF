async function buscarEndereco(inputCep) {
  const divRequerente = inputCep.closest('.requerente');
  const cep = inputCep.value.replace(/\D/g, "");

  if (cep.length !== 8) {
    alert("Por favor, digite um CEP válido com 8 números.");
    return;
  }

  const url = `https://viacep.com.br/ws/${cep}/json/`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Erro ao buscar o CEP.");

    const endereco = await response.json();
    if (endereco.erro) throw new Error("CEP não encontrado.");

    const logradouro = divRequerente.querySelector('input[name="logradouro"]');
    const bairro = divRequerente.querySelector('input[name="bairro"]');
    const cidade = divRequerente.querySelector('input[name="cidade"]');
    const estado = divRequerente.querySelector('input[name="estado"]');

    if (logradouro) logradouro.value = endereco.logradouro || "";
    if (bairro) bairro.value = endereco.bairro || "";
    if (cidade) cidade.value = endereco.localidade || "";
    if (estado) estado.value = endereco.uf || "";
  } catch (error) {
    alert(error.message);
    limparCamposEndereco(divRequerente);
  }
}

function limparCamposEndereco(divRequerente) {
  const logradouro = divRequerente.querySelector('input[name="logradouro"]');
  const bairro = divRequerente.querySelector('input[name="bairro"]');
  const cidade = divRequerente.querySelector('input[name="cidade"]');
  const estado = divRequerente.querySelector('input[name="estado"]');

  if (logradouro) logradouro.value = "";
  if (bairro) bairro.value = "";
  if (cidade) cidade.value = "";
  if (estado) estado.value = "";
}


async function gerarPDF() {
  const loadImageAsBase64 = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = url;
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => reject(`Erro ao carregar a imagem: ${url}`);
    });
  };

  const requerentes = Array.from(document.querySelectorAll('.requerente')).map(requerente => {
    const nome = requerente.querySelector('input[name="nome"]').value;
    const estadoCivil = requerente.querySelector('input[name="estadoCivil"]').value;
    const dataNascimento = requerente.querySelector('input[name="dataNascimento"]').value;
    const localNascimento = requerente.querySelector('input[name="localNascimento"]').value;
    const cpf = requerente.querySelector('input[name="cpf"]').value;
    const cep = requerente.querySelector('input[name="cep"]').value;
    const logradouro = requerente.querySelector('input[name="logradouro"]').value;
    const bairro = requerente.querySelector('input[name="bairro"]').value;
    const numero = requerente.querySelector('input[name="numero"]').value;
    const complemento = requerente.querySelector('input[name="complemento"]').value;
    const cidade = requerente.querySelector('input[name="cidade"]').value;
    const estado = requerente.querySelector('input[name="estado"]').value;
    const unicaGenitora = requerente.querySelector('input[name="unicaGenitora"]').checked;

    const filhos = Array.from(requerente.querySelectorAll('.filho')).map(filho => ({
      nome: filho.querySelector('input[name="nomeFilho[]"]').value,
      estadoCivil: filho.querySelector('input[name="estadoCivilFilho[]"]').value,
      dataNascimento: filho.querySelector('input[name="dataNascimentoFilho[]"]').value,
      localNascimento: filho.querySelector('input[name="localNascimentoFilho[]"]').value,
      cpf: filho.querySelector('input[name="cpfFilho[]"]').value,
      cep: filho.querySelector('input[name="cepFilho[]"]').value || cep,
    }));

    return { nome, estadoCivil, dataNascimento, localNascimento, cpf, cep, logradouro, bairro, numero, complemento, cidade, estado, unicaGenitora, filhos };
  });

  const bgImage = await loadImageAsBase64("/assets/bg.png");
  const dataEmissao = new Date().toLocaleDateString();

  let texto = [];
  const content = [];

  content.push(
    { text: "PROCURAÇÃO AD LITEM", style: "header", margin: [0, 0, 0, 5], bold: true, fontSize: 12 },
    { text: "Os abaixo assinandos:", margin: [0, 0, 0, 20] }
  );

  requerentes.forEach(requerente => {
    let dataFormatada = "";
    if (requerente.dataNascimento) {
      const dataNascimentoFormatada = new Date(requerente.dataNascimento);
      dataNascimentoFormatada.setDate(dataNascimentoFormatada.getDate() + 1);
      dataFormatada = dataNascimentoFormatada.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    }

    if (requerente.filhos.length === 0) {
      texto.push(
        { text: `${requerente.nome}`, bold: true },
        `, ${requerente.estadoCivil}, nascido(a) aos ${dataFormatada} na cidade de ${requerente.localNascimento}, CPF n. ${requerente.cpf}, residente no endereço: ${requerente.logradouro}, ${requerente.numero} ${requerente.complemento ? `, ${requerente.complemento}` : ""}, ${requerente.bairro}, ${requerente.cidade} - ${requerente.estado}, CEP ${requerente.cep}.`
      );
    } else if (requerente.unicaGenitora) {
      texto.push(
        { text: `${requerente.nome}`, bold: true },
        `, ${requerente.estadoCivil}, nascido(a) aos ${dataFormatada} na cidade de ${requerente.localNascimento}, CPF n. ${requerente.cpf}, em nome próprio e na qualidade de único(a) genitor(a) de seu(s) filho(s) menor(es): `
      );

      requerente.filhos.forEach((filho, index) => {
        let dataFilhoFormatada = "";
        if (filho.dataNascimento) {
          const dataFilhoNascimento = new Date(filho.dataNascimento);
          dataFilhoNascimento.setDate(dataFilhoNascimento.getDate() + 1);
          dataFilhoFormatada = dataFilhoNascimento.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          });
        }

        texto.push(
          { text: `${filho.nome}`, bold: true },
          `, ${filho.estadoCivil}, nascido(a) aos ${dataFilhoFormatada} na cidade de ${filho.localNascimento}, CPF n. ${filho.cpf}. `
        );
      });

      const todosMesmoEndereco = requerente.filhos.every(filho => filho.cep === requerente.cep);
      if (todosMesmoEndereco) {
        texto.push(
          `Residem no endereço: ${requerente.logradouro}, ${requerente.numero} ${requerente.complemento ? `, ${requerente.complemento}` : ""}, ${requerente.bairro}, ${requerente.cidade} - ${requerente.estado}, CEP ${requerente.cep}.`
        );
      } else {
        texto.push(`Cada um dos filhos reside em endereços distintos.`);
      }

    } else {
      texto.push(
        { text: `${requerente.nome}`, bold: true },
        `, ${requerente.estadoCivil}, nascido(a) aos ${dataFormatada} na cidade de ${requerente.localNascimento}, CPF n. ${requerente.cpf}, em nome próprio e na qualidade de genitor(a) e representante legal de seu(s) filho(s) menor(es): `
      );

      requerente.filhos.forEach((filho, index) => {
        let dataFilhoFormatada = "";
        if (filho.dataNascimento) {
          const dataFilhoNascimento = new Date(filho.dataNascimento);
          dataFilhoNascimento.setDate(dataFilhoNascimento.getDate() + 1);
          dataFilhoFormatada = dataFilhoNascimento.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          });
        }

        if (index === 0) {
          texto.push(
            { text: `${filho.nome}`, bold: true },
            `, ${filho.estadoCivil}, nascido(a) aos ${dataFilhoFormatada} na cidade de ${filho.localNascimento}, CPF n. ${filho.cpf}; `
          );
        } else if (index === requerente.filhos.length - 1) {
          texto.push(
            { text: `${filho.nome}`, bold: true },
            `, ${filho.estadoCivil}, nascido(a) aos ${dataFilhoFormatada} na cidade de ${filho.localNascimento}, CPF n. ${filho.cpf}. `
          );
          const todosMesmoEndereco = requerente.filhos.every(filho => filho.cep === requerente.cep);
          if (todosMesmoEndereco) {
            texto.push(
              `Residem no endereço: ${requerente.logradouro}, ${requerente.numero} ${requerente.complemento ? `, ${requerente.complemento}` : ""}, ${requerente.bairro}, ${requerente.cidade} - ${requerente.estado}, CEP ${requerente.cep}.`
            );
          } else {
            texto.push(`Cada um dos filhos reside em endereços distintos.`);
          }
        } else {
          texto.push(
            { text: `${filho.nome}`, bold: true },
            `, ${filho.estadoCivil}, nascido(a) aos ${dataFilhoFormatada} na cidade de ${filho.localNascimento}, CPF n. ${filho.cpf}; `
          );
        }
      });
    }

    texto.push("\n\n");
  });

  content.push(
    { text: texto, alignment: 'justify', fontSize: 11 },
    { text: "Conferem a procuração e a representação em juízo a Advogada Valeria Beggin (c.f. BGGVLR83M54F394R) do Foro de Verona, PEC: valeria.beggin@ordineavvocativrpec.it e a Advogada Ana Caroline Azevedo Michelon (código fiscal italiano ZVDNRL95A46Z602S) inscrita na Ordem dos Advogados de Verona – Seção Especial Avvocati Stabiliti, PEC anamichelon@pec.it ambas com escritório 37135 - Verona (VR) – Viale dell’Industria n. 25, Tel 0456119922, Fax 045 5706530, em ação a ser proposta perante o Tribunal competente e que tem por objeto a apreciação e declaração da cidadania italiana 'iure sanguinis', em todas as suas fases, estados e graus incluindo o processo de execução e qualquer oposição e confere o direito de processar, realizando pedidos reconvencionais e não convencionais independentes, lavrar e assinar todas as escrituras e documentos, dar e receber recibos e liberações e, em qualquer caso, fazer tudo o que for necessário e útil, mesmo que não esteja expressamente previsto neste mandato.", alignment: 'justify', margin: [0, 0, 0, 0] },
    { text: "Os referidos promotores também têm o poder de transigir e renunciar à ação a qualquer momento e em qualquer fase do julgamento; o mesmo poderá ser substituído por outros procuradores e eleger domicílio.", alignment: 'justify', margin: [0, 0, 0, 0] },
    { text: "Nos termos e para os efeitos previstos no art. 13 do Regulamento da UE n. 2016/679 e posteriores alterações e aditamentos, os abaixo assinados declaram ter sido informados oralmente e por escrito das finalidades e modalidades de tratamento dos seus dados pessoais, da obrigatoriedade ou facultatividade do fornecimento dos dados, das consequências de qualquer recusa, dos sujeitos a quem os dados podem ser comunicados, do direito de acesso aos dados pessoais que lhes digam respeito, dos elementos de identificação do titular dos dados; para este fim, dá o seu consentimento ao tratamento de dados sensíveis acima mencionado, para fins não estritamente judiciais.", alignment: 'justify', margin: [0, 0, 0, 0] },
    { text: "Domicílio é eleito no cargo de Avv. Valeria Beggin e Advogada Ana Caroline Azevedo Michelon, localizada em Verona (VR) – Viale dell’Industria n. 25.", alignment: 'justify', margin: [0, 0, 0, 0] }
  );

  content.push(
    { text: `Bebedouro, ${dataEmissao}`, margin: [0, 15, 0, 10] }
  );

  content.push({ text: "\n\n", fontSize: 11 });

  requerentes.forEach(requerente => {
    const assinaturaTexto = [];

    if (requerente.unicaGenitora && requerente.filhos.length > 0) {
      assinaturaTexto.push(
        { text: `${requerente.nome}`, bold: true },
        ` somente na qualidade de genitor(a) e representante legal de seus filhos menores `,
        ...requerente.filhos.map((filho, index) => [
          { text: `${filho.nome}`, bold: true },
          index < requerente.filhos.length - 1 ? " e " : ".",
        ]).flat()
      );
    } else if (!requerente.unicaGenitora && requerente.filhos.length > 0) {
      assinaturaTexto.push(
        { text: `${requerente.nome}`, bold: true },
        ` em nome próprio e na qualidade de genitor(a) e representante legal de seus filhos menores `,
        ...requerente.filhos.map((filho, index) => [
          { text: `${filho.nome}`, bold: true },
          index < requerente.filhos.length - 1 ? " e " : ".",
        ]).flat()
      );
    } else {
      assinaturaTexto.push({ text: `${requerente.nome}` });
    }

    content.push(
      { text: "_________________________________________________________", alignment: 'center', fontSize: 11, margin: [0, 20, 0, 10] },
      { text: assinaturaTexto, alignment: 'center', fontSize: 11, margin: [100, 0, 100, 10] },
    );
  });

  const docDefinition = {
    pageSize: "A4",
    pageMargins: [60, 60, 60, 40],
    content: content,
    styles: {
      header: { bold: true, fontSize: 12 },
      subHeader: { bold: true, fontSize: 11 },
      list: { fontSize: 10, margin: [10, 0, 0, 0] },
      paragraph: { fontSize: 10, alignment: "justify" },
      assinaturaNome: { fontSize: 11, bold: false },
    },
    background: {
      image: bgImage,
      width: 595.28,
      height: 841.89,
    },
  };

  pdfMake.createPdf(docDefinition).open();
}
function adicionarFilho(container) {
  const filhosContainer = container.querySelector('.filhosContainer');
  const novoFilho = `
    <div class="filho">
      <h4>Dados do Filho</h4>
      <label>Nome: <input type="text" name="nomeFilho[]" required></label><br>
      <label>Estado Civil: <input type="text" name="estadoCivilFilho[]" required></label><br>
      <label>Data de Nascimento: <input type="date" name="dataNascimentoFilho[]" required></label><br>
      <label>Local de Nascimento: <input type="text" name="localNascimentoFilho[]" required></label><br>
      <label>CPF: <input type="text" name="cpfFilho[]" required></label><br>
      <label>CEP (se diferente): <input type="text" name="cepFilho[]"></label><br><br>
    </div>`;
  filhosContainer.insertAdjacentHTML('beforeend', novoFilho);
}

function adicionarRequerente() {
  const container = document.getElementById('requerentesContainer');
  const novoRequerente = `
<div class="requerente">
  <h3>Dados do Requerente</h3>
  <label>Nome: <input type="text" name="nome" required></label><br>
  <label>Estado Civil: <input type="text" name="estadoCivil" required></label><br>
  <label>Data de Nascimento: <input type="date" name="dataNascimento" required></label><br>
  <label>Local de Nascimento: <input type="text" name="localNascimento" required></label><br>
  <label>CPF: <input type="text" name="cpf" required></label><br>
  <label for="cep">CEP:</label>
  <input type="text" name="cep" onblur="buscarEndereco(this)" placeholder="Digite o CEP" />
  <label for="logradouro">Logradouro:</label>
  <input type="text" name="logradouro" placeholder="Logradouro" readonly />
  <label for="numero">Número:</label>
  <input type="text" name="numero"/>
  <label for="complemento">Complemento:</label>
  <input type="text" name="complemento"/>
  <label for="bairro">Bairro:</label>
  <input type="text" name="bairro" placeholder="Bairro" readonly />
  <label for="cidade">Cidade:</label>
  <input type="text" name="cidade" placeholder="Cidade" readonly />
  <label for="estado">Estado:</label>
  <input type="text" name="estado" placeholder="Estado" readonly />
  <label><input type="checkbox" name="unicaGenitora"> Único Genitor(a)</label><br><br>
  <div class="filhosContainer"></div>
  <button type="button" onclick="adicionarFilho(this.parentElement)">Adicionar Filho</button><br><br>
</div>`;
  container.insertAdjacentHTML('beforeend', novoRequerente);
}

window.onload = () => {
  adicionarRequerente();
};