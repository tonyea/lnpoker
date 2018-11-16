--
-- lnpokerQL database dump
--

-- Dumped from database version 10.5 (Debian 10.5-1.pgdg90+1)
-- Dumped by pg_dump version 10.5 (Debian 10.5-1.pgdg90+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


--
-- Name: actions; Type: TYPE; Schema: public; Owner: lnpoker
--

CREATE TYPE public.actions AS ENUM (
    'check',
    'fold',
    'call',
    'all in',
    'bet'
);


ALTER TYPE public.actions OWNER TO lnpoker;

--
-- Name: handname; Type: TYPE; Schema: public; Owner: lnpoker
--

CREATE TYPE public.handname AS ENUM (
    'Four of a kind',
    'Full House',
    'Flush',
    'Straight Flush',
    'Straight',
    'Three of a Kind',
    'Two Pair',
    'Pair',
    'High Card'
);


ALTER TYPE public.handname OWNER TO lnpoker;

--
-- Name: set_action_timestamp(); Type: FUNCTION; Schema: public; Owner: lnpoker
--

CREATE FUNCTION public.set_action_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$ 
begin
	if new.currentplayer = true
	then
  NEW.action_timestamp = NOW();
 end if;
  RETURN NEW;
END;
 $$;


ALTER FUNCTION public.set_action_timestamp() OWNER TO lnpoker;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: tables; Type: TABLE; Schema: public; Owner: lnpoker
--

CREATE TABLE public.tables (
    id bigint NOT NULL,
    smallblind integer DEFAULT 1000 NOT NULL,
    bigblind integer DEFAULT 2000 NOT NULL,
    minplayers smallint DEFAULT 2 NOT NULL,
    maxplayers smallint DEFAULT 5 NOT NULL,
    minbuyin integer DEFAULT 100000 NOT NULL,
    maxbuyin integer DEFAULT 100000000 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    deck text[] DEFAULT '{}'::text[],
    pot integer DEFAULT 0 NOT NULL,
    roundname character varying DEFAULT 'Deal'::character varying NOT NULL,
    board text[] DEFAULT '{}'::text[],
    status character varying DEFAULT 'waiting'::character varying NOT NULL,
    timeout integer DEFAULT 30000 NOT NULL,
    CONSTRAINT tables_check CHECK ((minbuyin > 0))
);


ALTER TABLE public.tables OWNER TO lnpoker;

--
-- Name: tables_id_seq; Type: SEQUENCE; Schema: public; Owner: lnpoker
--

CREATE SEQUENCE public.tables_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.tables_id_seq OWNER TO lnpoker;

--
-- Name: tables_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: lnpoker
--

ALTER SEQUENCE public.tables_id_seq OWNED BY public.tables.id;


--
-- Name: user_table; Type: TABLE; Schema: public; Owner: lnpoker
--

CREATE TABLE public.user_table (
    id integer NOT NULL,
    player_id integer NOT NULL,
    table_id integer NOT NULL,
    dealer boolean DEFAULT false NOT NULL,
    chips integer DEFAULT 1000,
    talked boolean DEFAULT false,
    cards text[] DEFAULT '{}'::text[],
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    bet integer DEFAULT 0 NOT NULL,
    roundbet integer DEFAULT 0 NOT NULL,
    currentplayer boolean DEFAULT false NOT NULL,
    lastaction public.actions,
    rank numeric DEFAULT 0 NOT NULL,
    rankname public.handname,
    seated boolean DEFAULT false NOT NULL,
    action_timestamp timestamp with time zone
);


ALTER TABLE public.user_table OWNER TO lnpoker;

--
-- Name: user_table_id_seq; Type: SEQUENCE; Schema: public; Owner: lnpoker
--

CREATE SEQUENCE public.user_table_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_table_id_seq OWNER TO lnpoker;

--
-- Name: user_table_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: lnpoker
--

ALTER SEQUENCE public.user_table_id_seq OWNED BY public.user_table.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: lnpoker
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    username character varying(100) NOT NULL,
    password character varying(256) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    bank integer DEFAULT 100000 NOT NULL,
    CONSTRAINT users_check CHECK ((bank >= 0))
);


ALTER TABLE public.users OWNER TO lnpoker;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: lnpoker
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO lnpoker;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: lnpoker
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: tables id; Type: DEFAULT; Schema: public; Owner: lnpoker
--

ALTER TABLE ONLY public.tables ALTER COLUMN id SET DEFAULT nextval('public.tables_id_seq'::regclass);


--
-- Name: user_table id; Type: DEFAULT; Schema: public; Owner: lnpoker
--

ALTER TABLE ONLY public.user_table ALTER COLUMN id SET DEFAULT nextval('public.user_table_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: lnpoker
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: tables tables_pkey; Type: CONSTRAINT; Schema: public; Owner: lnpoker
--

ALTER TABLE ONLY public.tables
    ADD CONSTRAINT tables_pkey PRIMARY KEY (id);


--
-- Name: user_table user_table_pkey; Type: CONSTRAINT; Schema: public; Owner: lnpoker
--

ALTER TABLE ONLY public.user_table
    ADD CONSTRAINT user_table_pkey PRIMARY KEY (id);


--
-- Name: user_table user_table_un; Type: CONSTRAINT; Schema: public; Owner: lnpoker
--

ALTER TABLE ONLY public.user_table
    ADD CONSTRAINT user_table_un UNIQUE (player_id);


--
-- Name: users users_pk; Type: CONSTRAINT; Schema: public; Owner: lnpoker
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pk PRIMARY KEY (id);


--
-- Name: users users_un; Type: CONSTRAINT; Schema: public; Owner: lnpoker
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_un UNIQUE (username);


--
-- Name: user_table set_timestamp; Type: TRIGGER; Schema: public; Owner: lnpoker
--

CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.user_table FOR EACH ROW EXECUTE PROCEDURE public.set_action_timestamp();


--
-- lnpokerQL database dump complete
--

