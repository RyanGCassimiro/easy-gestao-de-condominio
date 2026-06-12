export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      usuario: {
        Row: {
          id_usuario:       string;
          email:            string;
          perfil:           'morador' | 'comerciante' | 'sindico' | 'porteiro';
          nome_fantasia:    string | null;
          foto_url:         string | null;
          aceite_termos_em: string | null;
          push_token:       string | null;
          created_at:       string;
        };
        Insert: {
          id_usuario:        string;
          email:             string;
          perfil:            'morador' | 'comerciante' | 'sindico' | 'porteiro';
          foto_url?:         string | null;
          aceite_termos_em?: string | null;
          push_token?:       string | null;
        };
        Update: {
          email?:            string;
          perfil?:           'morador' | 'comerciante' | 'sindico' | 'porteiro';
          foto_url?:         string | null;
          aceite_termos_em?: string | null;
          push_token?:       string | null;
        };
        Relationships: [];
      };
      morador: {
        Row: {
          id_usuario: string;
          nome:       string;
          cpf_hash:   string;
          unidade:    string;
          bloco:      string;
        };
        Insert: {
          id_usuario: string;
          nome:       string;
          cpf_hash:   string;
          unidade:    string;
          bloco:      string;
        };
        Update: {
          nome?:    string;
          unidade?: string;
          bloco?:   string;
        };
        Relationships: [
          {
            foreignKeyName: 'morador_id_usuario_fkey';
            columns: ['id_usuario'];
            isOneToOne: true;
            referencedRelation: 'usuario';
            referencedColumns: ['id_usuario'];
          }
        ];
      };
      comerciante: {
        Row: {
          id_usuario:       string;
          nome_fantasia:    string;
          cnpj:             string;
          nome_responsavel: string;
        };
        Insert: {
          id_usuario:       string;
          nome_fantasia:    string;
          cnpj:             string;
          nome_responsavel: string;
        };
        Update: {
          nome_fantasia?:    string;
          nome_responsavel?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'comerciante_id_usuario_fkey';
            columns: ['id_usuario'];
            isOneToOne: true;
            referencedRelation: 'usuario';
            referencedColumns: ['id_usuario'];
          }
        ];
      };
      postagem: {
        Row: {
          id_postagem:  number;
          id_autor:     string;
          titulo:       string;
          conteudo:     string;
          imagem_url:   string | null;
          whatsapp_url: string | null;
          categorias:   string[];
          is_maior18:   boolean;
          created_at:   string;
        };
        Insert: {
          id_autor?:     string;
          titulo:        string;
          conteudo:      string;
          imagem_url?:   string | null;
          whatsapp_url?: string | null;
          categorias?:   string[];
          is_maior18?:   boolean;
        };
        Update: {
          titulo?:       string;
          conteudo?:     string;
          imagem_url?:   string | null;
          whatsapp_url?: string | null;
          categorias?:   string[];
          is_maior18?:   boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'postagem_id_autor_fkey';
            columns: ['id_autor'];
            isOneToOne: false;
            referencedRelation: 'usuario';
            referencedColumns: ['id_usuario'];
          }
        ];
      };
      curtida: {
        Row: { id_curtida: number; id_postagem: number; id_usuario: string };
        Insert: { id_postagem: number };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: 'curtida_id_postagem_fkey';
            columns: ['id_postagem'];
            isOneToOne: false;
            referencedRelation: 'postagem';
            referencedColumns: ['id_postagem'];
          }
        ];
      };
      reserva: {
        Row: {
          id_reserva:          number;
          id_usuario:          string;
          id_espaco:           number;
          data:                string;
          hora_inicio:         string;
          hora_fim:            string;
          observacao:          string | null;
          status:              'ativa' | 'cancelada';
          motivo_cancelamento: string | null;
        };
        Insert: {
          id_usuario:   string;
          id_espaco:    number;
          data:         string;
          hora_inicio:  string;
          hora_fim:     string;
          observacao?:  string | null;
          status?:      'ativa' | 'cancelada';
        };
        Update: {
          status?:              'ativa' | 'cancelada';
          motivo_cancelamento?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'reserva_id_espaco_fkey';
            columns: ['id_espaco'];
            isOneToOne: false;
            referencedRelation: 'espaco_comum';
            referencedColumns: ['id_espaco'];
          }
        ];
      };
      espaco_comum: {
        Row: { id_espaco: number; nome: string; descricao: string | null; ativo: boolean };
        Insert: { nome: string; descricao?: string | null; ativo?: boolean };
        Update: { nome?: string; descricao?: string | null; ativo?: boolean };
        Relationships: [];
      };
      aviso: {
        Row: {
          id_aviso:      number;
          titulo:        string;
          conteudo:      string;
          prioridade:    'normal' | 'urgente' | 'info';
          bloco:         string | null;
          andar:         number | null;
          expira_em:     string | null;
          id_condominio: number;
          created_at:    string;
        };
        Insert: {
          titulo:         string;
          conteudo:       string;
          prioridade?:    'normal' | 'urgente' | 'info';
          bloco?:         string | null;
          andar?:         number | null;
          expira_em?:     string | null;
          id_condominio?: number;
        };
        Update: {
          titulo?:     string;
          conteudo?:   string;
          prioridade?: 'normal' | 'urgente' | 'info';
        };
        Relationships: [];
      };
      visualiza_aviso: {
        Row: { id_aviso: number; id_usuario: string };
        Insert: { id_aviso: number };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: 'visualiza_aviso_id_aviso_fkey';
            columns: ['id_aviso'];
            isOneToOne: false;
            referencedRelation: 'aviso';
            referencedColumns: ['id_aviso'];
          }
        ];
      };
      assembleia: {
        Row: {
          id_assembleia: number;
          titulo:        string;
          descricao:     string | null;
          data_hora:     string;
          local:         string;
          modalidade:    'presencial' | 'online' | 'hibrida';
        };
        Insert: {
          titulo:       string;
          descricao?:   string | null;
          data_hora:    string;
          local:        string;
          modalidade?:  'presencial' | 'online' | 'hibrida';
        };
        Update: {
          titulo?:      string;
          descricao?:   string | null;
          data_hora?:   string;
          local?:       string;
          modalidade?:  'presencial' | 'online' | 'hibrida';
        };
        Relationships: [];
      };
      pauta: {
        Row: {
          id_pauta:      number;
          id_assembleia: number;
          titulo:        string;
          descricao:     string | null;
          ordem:         number;
        };
        Insert: {
          id_assembleia: number;
          titulo:        string;
          descricao?:    string | null;
          ordem:         number;
        };
        Update: {
          titulo?:    string;
          descricao?: string | null;
          ordem?:     number;
        };
        Relationships: [
          {
            foreignKeyName: 'pauta_id_assembleia_fkey';
            columns: ['id_assembleia'];
            isOneToOne: false;
            referencedRelation: 'assembleia';
            referencedColumns: ['id_assembleia'];
          }
        ];
      };
      voto: {
        Row: {
          id_voto:    number;
          id_pauta:   number;
          id_usuario: string;
          opcao:      'sim' | 'nao' | 'abstencao';
          data_hora:  string;
        };
        Insert: {
          id_pauta:  number;
          opcao:     'sim' | 'nao' | 'abstencao';
          data_hora: string;
        };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: 'voto_id_pauta_fkey';
            columns: ['id_pauta'];
            isOneToOne: false;
            referencedRelation: 'pauta';
            referencedColumns: ['id_pauta'];
          }
        ];
      };
      item_achado: {
        Row: {
          id_item:             number;
          descricao:           string;
          local_achado:        string;
          imagem_url:          string | null;
          data_achado:         string;
          status:              'disponivel' | 'retirado';
          nome_retirada:       string | null;
          documento_retirada:  string | null;
          observacao_retirada: string | null;
          data_retirada:       string | null;
          created_at:          string;
        };
        Insert: {
          descricao:    string;
          local_achado: string;
          imagem_url?:  string | null;
          data_achado:  string;
          status?:      'disponivel' | 'retirado';
        };
        Update: {
          status?:              'disponivel' | 'retirado';
          nome_retirada?:       string | null;
          documento_retirada?:  string | null;
          observacao_retirada?: string | null;
          data_retirada?:       string | null;
        };
        Relationships: [];
      };
      dependente: {
        Row: {
          id_dependente:      number;
          nome:               string;
          raca:               string | null;
          especie:            string | null;
          imagem_url:         string | null;
          data_nasc:          string | null;
          observacao:         string | null;
          tipo:               'pet' | 'pessoa';
          consentimento_lgpd: boolean;
        };
        Insert: {
          nome:                string;
          raca?:               string | null;
          especie?:            string | null;
          imagem_url?:         string | null;
          data_nasc?:          string | null;
          observacao?:         string | null;
          tipo:                'pet' | 'pessoa';
          consentimento_lgpd?: boolean;
        };
        Update: {
          nome?:       string;
          raca?:       string | null;
          especie?:    string | null;
          imagem_url?: string | null;
          data_nasc?:  string | null;
          observacao?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      inserir_audit_log: {
        Args: {
          p_acao:        string;
          p_entidade:    string;
          p_id_entidade: string | null;
          p_detalhes:    Json | null;
        };
        Returns: void;
      };
    };
    Enums: Record<string, never>;
  };
}
