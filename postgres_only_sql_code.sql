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
	job_id, title, category, address_coordinate, min_salary, max_salary, min_experience, min_education, ontop, full_time_job, tags, expired_at, "updatedAt", hr_name, hr_pos, comp_name, comp_size, comp_financing, logo) 
	SELECT "Job"."id","Job"."title", "Job"."category", "Job"."address_coordinate", "Job"."min_salary", "Job"."max_salary", "Job"."min_experience", "Job"."min_education", "Job"."ontop", "Job"."full_time_job", "Job"."tags", "Job"."expired_at", "Job"."updatedAt", "Worker"."real_name" AS "Worker.real_name", "Worker"."pos" AS "Worker.pos", "Worker->Enterprise"."enterprise_name" AS "Worker.Enterprise.enterprise_name", "Worker->Enterprise"."enterprise_size" AS "Worker.Enterprise.enterprise_size", "Worker->Enterprise"."enterprise_financing" AS "Worker.Enterprise.enterprise_financing", "Worker->User"."image_url" AS "Worker.User.image_url" FROM "job" AS "Job" LEFT OUTER JOIN "worker" AS "Worker" ON "Job"."worker_id" = "Worker"."id" LEFT OUTER JOIN "enterprise" AS "Worker->Enterprise" ON "Worker"."company_belonged" = "Worker->Enterprise"."id" LEFT OUTER JOIN "users" AS "Worker->User" ON "Worker"."user_binding" = "Worker->User"."id" WHERE "Job"."id" = NEW.id;

  RETURN NULL;
END;
$$;
DROP TRIGGER IF EXISTS trigger_generate_cache_for_new_inserted_job ON job;
CREATE TRIGGER trigger_generate_cache_for_new_inserted_job
    after INSERT ON job
    For each row
    EXECUTE PROCEDURE generate_cache_for_new_inserted_job();

    
CREATE OR REPLACE FUNCTION update_cache_when_origin_updated() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  DELETE FROM public.job_cache where job_id = NEW.id;
  INSERT INTO public.job_cache(
	job_id, title, category, address_coordinate, address_description, min_salary, max_salary, min_experience, min_education, ontop, full_time_job, tags, expired_at, "updatedAt", hr_name, hr_pos, comp_name, comp_size, comp_financing, logo) 
	SELECT "Job"."id","Job"."title", "Job"."category", "Job"."address_coordinate", "job"."address_description", "Job"."min_salary", "Job"."max_salary", "Job"."min_experience", "Job"."min_education", "Job"."ontop", "Job"."full_time_job", "Job"."tags", "Job"."expired_at", "Job"."updatedAt", "Worker"."real_name" AS "Worker.real_name", "Worker"."pos" AS "Worker.pos", "Worker->Enterprise"."enterprise_name" AS "Worker.Enterprise.enterprise_name", "Worker->Enterprise"."enterprise_size" AS "Worker.Enterprise.enterprise_size", "Worker->Enterprise"."enterprise_financing" AS "Worker.Enterprise.enterprise_financing", "Worker->User"."image_url" AS "Worker.User.image_url" FROM "job" AS "Job" LEFT OUTER JOIN "worker" AS "Worker" ON "Job"."worker_id" = "Worker"."id" LEFT OUTER JOIN "enterprise" AS "Worker->Enterprise" ON "Worker"."company_belonged" = "Worker->Enterprise"."id" LEFT OUTER JOIN "users" AS "Worker->User" ON "Worker"."user_binding" = "Worker->User"."id" WHERE "Job"."id" = NEW.id;

  RETURN NULL;
END;
$$;
DROP TRIGGER IF EXISTS trigger_update_cache_when_origin_updated ON job;
CREATE TRIGGER trigger_update_cache_when_origin_updated
    after UPDATE ON job
    For each row
    EXECUTE PROCEDURE update_cache_when_origin_updated();
CREATE OR REPLACE FUNCTION count_answers_when_new_answer_is_inserted() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  update enterprise_question set answer_count = enterprise_question.answer_count + 1 where enterprise_question.id = NEW.question_id;
  RETURN NULL;
END;
$$;
DROP TRIGGER IF EXISTS trigger_count_answers_when_new_answer_is_inserted ON enterprise_answer;
CREATE TRIGGER trigger_count_answers_when_new_answer_is_inserted
    after INSERT ON enterprise_answer
    For each row
    EXECUTE PROCEDURE count_answers_when_new_answer_is_inserted();
CREATE OR REPLACE FUNCTION count_answers_when_an_answer_is_deleted() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  update enterprise_question set answer_count = enterprise_question.answer_count - 1 where enterprise_question.id = NEW.question_id;
  RETURN NULL;
END;
$$;
DROP TRIGGER IF EXISTS trigger_count_answers_when_an_answer_is_deleted ON enterprise_answer;
CREATE TRIGGER trigger_count_answers_when_an_answer_is_deleted
    after delete ON enterprise_answer
    For each row
    EXECUTE PROCEDURE count_answers_when_an_answer_is_deleted();

CREATE OR REPLACE FUNCTION count_unreaded_msg_for_contract_list() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  update contract_list set unreaded_count = (select count(user_id) from message where user_id = NEW.user_id and message."from" = NEW."from" and readed = false) where user_id = NEW.user_id;
  RETURN NULL;
END;
$$;
DROP TRIGGER IF EXISTS trigger_count_unreaded_msg_for_contract_list_on_insert ON message;
DROP TRIGGER IF EXISTS trigger_count_unreaded_msg_for_contract_list_on_update ON message;
CREATE TRIGGER trigger_count_unreaded_msg_for_contract_list_on_insert
    after insert ON message
    For each row
    EXECUTE PROCEDURE count_unreaded_msg_for_contract_list();
CREATE TRIGGER trigger_count_unreaded_msg_for_contract_list_on_update
    after update ON message
    For each row
    EXECUTE PROCEDURE count_unreaded_msg_for_contract_list();
