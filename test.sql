SELECT
    json_build_object(
        'aggregate',
        json_build_object('count', COUNT(*))
    ) AS "root"
FROM
    (
        SELECT
            1 AS "root__one"
        FROM
            (
                SELECT
                    *
                FROM
                    "public"."book"
                WHERE
                    ('true')
            ) AS "_0_root.base"
    ) AS "_1_root"