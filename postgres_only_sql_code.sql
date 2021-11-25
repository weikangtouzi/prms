CREATE OR REPLACE FUNCTION delete_expired_and_not_applied_interview_invitation() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  DELETE FROM interview WHERE appointment_time < CURRENT_TIMESTAMP and status = null;
  RETURN NULL;
END;
$$;
DROP TRIGGER IF EXISTS trigger_delete_expired_and_not_applied_interview_invitation ON interview;
CREATE TRIGGER trigger_delete_expired_and_not_applied_interview_invitation
    before INSERT ON interview
    EXECUTE PROCEDURE delete_expired_and_not_applied_interview_invitation();


CREATE OR REPLACE FUNCTION generate_cache_for_new_inserted_job() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO public.job_cache(
	job_id, title, category, adress_coordinate, min_salary, max_salary, min_experience, min_education, ontop, full_time_job, tags, expired_at, "updatedAt", hr_name, hr_pos, comp_name, comp_size, comp_financing, logo) 
	SELECT "Job"."id","Job"."title", "Job"."category", "Job"."adress_coordinate", "Job"."min_salary", "Job"."max_salary", "Job"."min_experience", "Job"."min_education", "Job"."ontop", "Job"."full_time_job", "Job"."tags", "Job"."expired_at", "Job"."updatedAt", "Worker"."real_name" AS "Worker.real_name", "Worker"."pos" AS "Worker.pos", "Worker->Enterprise"."enterprise_name" AS "Worker.Enterprise.enterprise_name", "Worker->Enterprise"."enterprise_size" AS "Worker.Enterprise.enterprise_size", "Worker->Enterprise"."enterprise_financing" AS "Worker.Enterprise.enterprise_financing", "Worker->User"."image_url" AS "Worker.User.image_url" FROM "job" AS "Job" LEFT OUTER JOIN "worker" AS "Worker" ON "Job"."worker_id" = "Worker"."id" LEFT OUTER JOIN "enterprise" AS "Worker->Enterprise" ON "Worker"."company_belonged" = "Worker->Enterprise"."id" LEFT OUTER JOIN "users" AS "Worker->User" ON "Worker"."user_binding" = "Worker->User"."id" WHERE "Job"."id" = NEW.id;

  RETURN NULL;
END;
$$;
DROP TRIGGER IF EXISTS trigger_generate_cache_for_new_inserted_job ON job;
CREATE TRIGGER trigger_generate_cache_for_new_inserted_job
    after INSERT ON job
    For each row
    EXECUTE PROCEDURE generate_cache_for_new_inserted_job();
ALTER TABLE public.job_cache DROP CONSTRAINT job_cache_job_id_fkey;
ALTER TABLE public.job_cache
    ADD CONSTRAINT job_cache_job_id_fkey FOREIGN KEY (job_id)
    REFERENCES public.job (id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE CASCADE;