--
-- PostgreSQL database dump
--

\restrict q7zgDSvTmEwUfofkU207FWtgX2ea2uamhrxBb3DsOz6fy6kql9e32jyrzBnHi4l

-- Dumped from database version 16.11
-- Dumped by pg_dump version 16.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: knowledge_books; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.knowledge_books (id, title, description, category, file_type, file_path, file_name, file_size, cover_image, author, uploaded_by, views, downloads, tags, is_published, created_at, updated_at) VALUES ('bc53cd1a-ba07-4167-856c-a0c09f29319f', 'Security literacy improvement November', NULL, 'Tutorials', 'pdf', 'uploads/knowledge-books/a0e59988-eeeb-4402-ad52-ce6248b5d736.pdf', 'Security literacy improvement November.pdf', 994297, NULL, NULL, '61cfb8eb-a050-432d-bf1f-c0e2f3236f7a', 0, 0, '{}', true, '2026-01-05 16:46:04.275', '2026-01-05 16:46:04.275');


--
-- Data for Name: book_views; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- PostgreSQL database dump complete
--

\unrestrict q7zgDSvTmEwUfofkU207FWtgX2ea2uamhrxBb3DsOz6fy6kql9e32jyrzBnHi4l

